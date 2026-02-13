from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import pandas as pd

ARTIFACT_DIR = Path(__file__).resolve().parent.parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "model.joblib"
META_PATH = ARTIFACT_DIR / "metadata.json"


class ModelBundle:
    def __init__(self) -> None:
        self.pipeline = None
        self.meta: dict[str, Any] = {}
        self.loaded: bool = False

    def load(self) -> None:
        if not MODEL_PATH.exists() or not META_PATH.exists():
            self.loaded = False
            return

        self.pipeline = joblib.load(MODEL_PATH)
        self.meta = json.loads(META_PATH.read_text(encoding="utf-8"))
        self.loaded = True

    @property
    def expected_features(self) -> list[str]:
        return list(self.meta.get("expected_features", []))

    @property
    def target_column(self) -> str:
        return self.meta.get("target_column", "income")

    @property
    def positive_label(self) -> str:
        return self.meta.get("positive_label", ">50K")

    @property
    def threshold(self) -> float:
        return float(self.meta.get("threshold", 0.5))

    @property
    def model_name(self) -> str:
        return self.meta.get("model_name", "unknown-model")

    @property
    def label_mapping(self) -> dict:
        return self.meta.get("label_mapping", {"0": "<=50K", "1": ">50K"})

    def _row_to_dataframe(self, features: Dict[str, Any]) -> pd.DataFrame:
        row = {col: features.get(col, None) for col in self.expected_features}
        return pd.DataFrame([row], columns=self.expected_features)

    def predict(self, features: Dict[str, Any]) -> dict[str, Any]:
        if not self.loaded or self.pipeline is None:
            raise RuntimeError("Model is not loaded. Train first and ensure artifacts exist.")

        X = self._row_to_dataframe(features)

        proba: Optional[float] = None
        if hasattr(self.pipeline, "predict_proba"):
            p = self.pipeline.predict_proba(X)
            proba = float(p[0, 1])

        if proba is not None:
            pred_int = 1 if proba >= self.threshold else 0
        else:
            pred_int = int(self.pipeline.predict(X)[0])

        label = self.label_mapping.get(str(pred_int), str(pred_int))

        result = {
            "label": label,
            "probability": proba,
            "threshold": self.threshold,
            "positive_label": self.positive_label,
            "model": self.model_name,
        }

        top_factors = self.meta.get("top_factors")
        if isinstance(top_factors, list) and len(top_factors) > 0:
            result["top_factors"] = top_factors[:8]
        else:
            result["top_factors"] = None

        return result


bundle = ModelBundle()
bundle.load()
