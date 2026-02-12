from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import f1_score
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier


ARTIFACT_DIR = Path(__file__).resolve().parent.parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "model.joblib"
META_PATH = ARTIFACT_DIR / "metadata.json"


def clean_strings(df: pd.DataFrame) -> pd.DataFrame:
    # Strip spaces in object columns, handle common "?" missing markers
    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace({"?": np.nan, "nan": np.nan})
    return df


def build_preprocessor(X: pd.DataFrame) -> tuple[ColumnTransformer, list[str], list[str]]:
    # Auto-detect numeric vs categorical
    numeric_cols = [c for c in X.columns if pd.api.types.is_numeric_dtype(X[c])]
    categorical_cols = [c for c in X.columns if c not in numeric_cols]

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_cols),
            ("cat", categorical_transformer, categorical_cols),
        ],
        remainder="drop",
    )

    return preprocessor, numeric_cols, categorical_cols


def extract_top_factors_from_pipeline(pipeline: Pipeline, model_name: str, k: int = 8) -> list[dict[str, Any]]:
    """
    Lightweight explanation:
    - Logistic Regression: top absolute coefficients
    - Random Forest: top feature importances
    """
    try:
        pre = pipeline.named_steps["preprocess"]
        clf = pipeline.named_steps["clf"]

        # feature names after preprocessing (including one-hot)
        feature_names = pre.get_feature_names_out()

        if model_name.lower().startswith("logistic"):
            coefs = clf.coef_.ravel()
            idx = np.argsort(np.abs(coefs))[::-1][:k]
            return [{"feature": str(feature_names[i]), "weight": float(coefs[i])} for i in idx]

        if model_name.lower().startswith("random"):
            imps = clf.feature_importances_
            idx = np.argsort(imps)[::-1][:k]
            return [{"feature": str(feature_names[i]), "importance": float(imps[i])} for i in idx]

    except Exception:
        pass

    return []


def main():
    parser = argparse.ArgumentParser(description="Train IncomeLens ML model (LogReg vs RandomForest).")
    parser.add_argument("--csv", required=True, help="Path to CSV dataset file")
    parser.add_argument("--target", default="income", help="Target column name (default: income)")
    parser.add_argument("--positive_label", default=">50K", help="Positive class label text (default: >50K)")
    parser.add_argument("--test_size", type=float, default=0.2, help="Test split size (default: 0.2)")
    parser.add_argument("--random_state", type=int, default=42, help="Random seed")
    parser.add_argument("--threshold", type=float, default=0.5, help="Decision threshold for probability")
    args = parser.parse_args()

    csv_path = Path(args.csv).resolve()
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    df = pd.read_csv(csv_path)
    df = clean_strings(df)

    if args.target not in df.columns:
        raise ValueError(f"Target column '{args.target}' not in dataset columns: {list(df.columns)}")

    # Drop rows where target missing
    df = df.dropna(subset=[args.target])

    y_raw = df[args.target].astype(str).str.strip()
    X = df.drop(columns=[args.target])

    # Build y as 0/1
    y = (y_raw == args.positive_label).astype(int)

    preprocessor, num_cols, cat_cols = build_preprocessor(X)

    # Pipelines
    logreg = Pipeline(
        steps=[
            ("preprocess", preprocessor),
            ("clf", LogisticRegression(max_iter=2000, class_weight="balanced")),
        ]
    )

    rf = Pipeline(
        steps=[
            ("preprocess", preprocessor),
            ("clf", RandomForestClassifier(random_state=args.random_state)),
        ]
    )

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.random_state, stratify=y
    )

    # Grid searches (kept small so it trains fast)
    logreg_grid = {
        "clf__C": [0.1, 1.0, 3.0],
        "clf__penalty": ["l2"],
        "clf__solver": ["lbfgs"],
    }

    rf_grid = {
        "clf__n_estimators": [200, 400],
        "clf__max_depth": [None, 10, 20],
        "clf__min_samples_split": [2, 5],
    }

    print("Training Logistic Regression (GridSearchCV)...")
    gs_lr = GridSearchCV(logreg, logreg_grid, scoring="f1", cv=3, n_jobs=-1)
    gs_lr.fit(X_train, y_train)

    print("Training Random Forest (GridSearchCV)...")
    gs_rf = GridSearchCV(rf, rf_grid, scoring="f1", cv=3, n_jobs=-1)
    gs_rf.fit(X_train, y_train)

    # Evaluate on test
    best_lr = gs_lr.best_estimator_
    best_rf = gs_rf.best_estimator_

    lr_pred = best_lr.predict(X_test)
    rf_pred = best_rf.predict(X_test)

    lr_f1 = f1_score(y_test, lr_pred)
    rf_f1 = f1_score(y_test, rf_pred)

    print(f"Test F1 - Logistic Regression: {lr_f1:.4f}")
    print(f"Test F1 - Random Forest:       {rf_f1:.4f}")

    if rf_f1 > lr_f1:
        best = best_rf
        best_name = "RandomForest"
        best_f1 = rf_f1
    else:
        best = best_lr
        best_name = "LogisticRegression"
        best_f1 = lr_f1

    # Save artifacts
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(best, MODEL_PATH)

    expected_features = list(X.columns)

    label_mapping = {"0": "<=50K", "1": args.positive_label}
    top_factors = extract_top_factors_from_pipeline(best, best_name, k=10)

    metadata = {
        "project": "IncomeLens ML",
        "model_name": best_name,
        "test_f1": float(best_f1),
        "target_column": args.target,
        "positive_label": args.positive_label,
        "threshold": float(args.threshold),
        "expected_features": expected_features,
        "numeric_features": num_cols,
        "categorical_features": cat_cols,
        "label_mapping": label_mapping,
        "top_factors": top_factors,
    }

    META_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print("\n✅ Saved:")
    print(f" - Model:    {MODEL_PATH}")
    print(f" - Metadata: {META_PATH}")
    print("\nNext: run the API and test /schema and /predict.")


if __name__ == "__main__":
    main()
