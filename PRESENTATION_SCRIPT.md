# IncomeLens ML — Presentation Script
**Duration: ~15 minutes | Format: Colab walkthrough → Live App Demo**

---

## OPENING (30 seconds)

> "Today I'm presenting IncomeLens ML — a full-stack machine learning application that predicts whether a person earns more than 50K or 50K or less per year, based on census data.
>
> The project has three layers: a trained machine learning model, a FastAPI backend that serves predictions, and a React frontend where users interact with it.
>
> I'll walk through the ML pipeline first in Colab, then show the live app."

---

## COLAB WALKTHROUGH

---

### Step 1 — Imports
*[Run the cell. It finishes instantly.]*

> "Standard ML stack — pandas for data, scikit-learn for the pipeline and models, and matplotlib for visualization. Nothing exotic."

---

### Step 2 — Load the Dataset
*[Run the cell. Show df.head() output.]*

> "This is the UCI Adult Census dataset — 32,561 rows, 14 features per person.
>
> Each row is one person. The features include things like age, education level, occupation, marital status, and capital gains.
>
> The target column is income — either less than or equal to 50K, or greater than 50K."

---

### Step 3 — Class Distribution
*[Run the cell. Point at the bar chart.]*

> "Before touching any model, the first thing I always check is class distribution.
>
> Here you can see the problem — 75% of the dataset is the less than 50K class, and only 25% is greater than 50K. That's a significant imbalance.
>
> Why does this matter? If I had a completely dumb model that just predicted less than 50K every single time, it would get 75% accuracy. That looks decent on paper, but the model learned nothing useful.
>
> This is why we cannot use accuracy as our metric. Instead, we use **F1 score**, which balances precision and recall and properly penalizes ignoring the minority class."

---

### Step 4 — Data Cleaning
*[Run the cell. Show the before/after missing values.]*

> "The UCI dataset uses a question mark as a placeholder for missing values — which is common in older datasets.
>
> We strip whitespace from all string columns and replace those question marks with proper NaN values so that scikit-learn can handle them correctly.
>
> Notice the affected columns are workclass, occupation, and native.country. We don't drop these rows — we'll impute them inside the pipeline in the next step."

---

### Step 5 — Train / Test Split
*[Run the cell. Show the ratio output.]*

> "We split 80% for training and 20% for testing.
>
> The key parameter here is **stratify=y**. Without it, the random split might by chance give us a test set with a very different class ratio than the training set, which would give misleading evaluation results.
>
> With stratify, both sets mirror the original 75/25 ratio — you can see that in the output. Both train and test have the same distribution."

---

### Step 6 — sklearn Pipeline
*[Run the cell. Show the printed feature lists.]*

> "This is the most important engineering decision in the project — using a scikit-learn Pipeline.
>
> The pipeline wraps the preprocessor and the model into a single object. Here's why that matters:
>
> If I fit the imputer or encoder on the full dataset before splitting, the test set leaks information into training. The model appears better than it really is — and in production, it would perform worse than expected.
>
> With a Pipeline, when I call fit on the training data, the imputer and encoder learn only from that training data. When I call predict on the test set, those same learned transforms are applied without refitting. No leakage.
>
> We also handle the two feature types differently. Numeric features like age and capital gain are imputed with the **median** — not the mean — because features like capital gain have extreme outliers. Many people have zero, a few have 99,000. The median stays realistic.
>
> Categorical features like workclass and occupation are imputed with the **most frequent** value, then one-hot encoded.
>
> We also use handle_unknown='ignore' in the encoder. That means if a user enters a country that wasn't in the training data, the model won't crash — it just outputs all zeros for that category."

---

### Step 7 — GridSearchCV
*[Run the cell. This takes 3-5 minutes — talk while it runs.]*

> "We're not just picking one model — we're comparing two different model families.
>
> **Logistic Regression** is fast and interpretable. It works well when the relationship between features and the target is roughly linear.
>
> **Random Forest** is an ensemble of decision trees. It handles non-linear relationships and mixed data types much better, and it gives us feature importance for free.
>
> For each model, GridSearchCV tries every combination of hyperparameters and picks the best one using 3-fold cross-validation, again scored on F1.
>
> For Logistic Regression, we're tuning the regularization strength C. For Random Forest, we're tuning the number of trees, the maximum depth, and the minimum samples to split a node.
>
> The cross-validation happens only on the training data — the test set is untouched until the very end."

*[Wait for it to finish. Read out the best params and CV F1.]*

> "You can see the best parameters found for each model and their cross-validation F1 scores."

---

### Step 8 — Evaluate on Test Set
*[Run the cell. Point at the bar chart.]*

> "Now we evaluate both winners on the held-out test set — data neither model has seen at all.
>
> Random Forest wins with a higher test F1. This tells us it generalizes better to unseen data.
>
> This is the model we save and deploy to the API."

---

### Step 9 — Classification Report
*[Run the cell. Walk through the report and confusion matrix.]*

> "F1 as a single number doesn't tell the full story, so let's break it down by class.
>
> Looking at the report — for the greater than 50K class, we can see the precision, recall, and F1 separately.
>
> The confusion matrix shows it visually. The top-left is correct less than 50K predictions, bottom-right is correct greater than 50K predictions.
>
> The bottom-left — predicting less than 50K when the person actually earns more — is the costly error. The model misses some high earners. That's expected given the class imbalance, and it's exactly what F1 is capturing."

---

### Step 10 — Feature Importance
*[Run the cell. Point at the horizontal bar chart.]*

> "This is one of the reasons we chose Random Forest — it gives us feature importance for free.
>
> Each bar represents how much that feature reduces impurity across all the trees on average. Higher means more useful for making the right prediction.
>
> **Capital gain is the strongest predictor** — investment income strongly separates high earners from low earners.
>
> **Marital status — specifically being married** — is second. This is correlated with age and career stability.
>
> **Education years and age** follow — which makes intuitive sense. More education and more career experience lead to higher income.
>
> After one-hot encoding, each category becomes its own binary feature, which is why you see things like marital.status_Married as a standalone predictor."

---

### Step 11 — Live Prediction
*[Run the cell. Show the output.]*

> "Finally, this cell shows exactly what happens when a user submits the form in our app.
>
> We take a dictionary of feature values, convert it to a single-row DataFrame, run it through the pipeline — which applies the same imputation and encoding learned during training — and call predict_proba.
>
> That gives us a probability between 0 and 1. If it's above our threshold of 0.5, we predict greater than 50K.
>
> The label, the probability, and the threshold are exactly what the FastAPI backend returns to the React frontend."

---

## LIVE APP DEMO (5 minutes)

*[Switch to the browser. Backend should already be running.]*

---

### Show the API docs

> "The backend is a FastAPI app. FastAPI auto-generates this interactive docs page — it's one of the reasons we chose it.
>
> We have three endpoints: health to check if the model is loaded, schema to get the expected input features, and predict which is what the frontend calls."

---

### Open the Frontend

> "This is the IncomeLens app. The header shows two badges — API status and Model status — both green, which means the backend is running and the model is loaded.
>
> The form is generated dynamically from the /schema endpoint, so if we ever retrain with different features, the form updates automatically without touching the frontend code."

---

### Run a Prediction

*[Click "Example Data" to fill the form, then click Predict.]*

> "I'll use the example data button to fill in a sample profile — 37 years old, private sector, bachelor's degree, married, professional specialty.
>
> The model returns a prediction, a confidence percentage, and the top 8 factors that influenced this specific result.
>
> The confidence bar shows the probability visually."

---

### Show History

*[Submit 2-3 more predictions with different values.]*

> "Every prediction is saved locally. The history tab shows the line chart tracking how the probability changes across different inputs — useful for seeing how changing one feature, like education level, shifts the prediction."

---

## CLOSING (30 seconds)

> "To summarize — the ML pipeline uses stratified splits, cross-validated hyperparameter search, and a proper sklearn Pipeline to prevent leakage. We compared two model families and selected Random Forest based on test F1.
>
> The backend serves predictions through a typed FastAPI API. The frontend is a React app that dynamically adapts to whatever model is deployed.
>
> Happy to answer any questions."

---

## QUICK ANSWERS FOR COMMON QUESTIONS

**Q: Why F1 and not accuracy?**
> "75% of the data is <=50K. Accuracy would reward a model that never predicts >50K. F1 penalizes that."

**Q: Why median imputation, not mean?**
> "Capital gain has extreme outliers — many zeros, a few at 99,000. Mean gets pulled by outliers. Median stays in a realistic range."

**Q: What is data leakage?**
> "If you fit the imputer on the full dataset before splitting, the test set's statistics bleed into training. The Pipeline prevents this — the imputer only sees training data."

**Q: What is stratify=y?**
> "It preserves the original class ratio in both train and test splits, so the evaluation is representative."

**Q: What does handle_unknown='ignore' do?**
> "At inference time, a user might enter a value not seen during training — like a rare country. Instead of crashing, the encoder outputs all zeros for that category."

**Q: Why Random Forest over Logistic Regression?**
> "Random Forest handles non-linear relationships and mixed data types naturally. It also outperformed Logistic Regression on the test F1. Logistic Regression was given a fair shot — we used class_weight='balanced' to compensate for the imbalance."

**Q: How would you improve it?**
> "Try XGBoost or LightGBM — generally stronger on tabular data. Tune the decision threshold based on the business cost of false negatives vs false positives. Consider dropping fnlwgt — it's a census sampling weight, not a real income predictor."

**Q: What is fnlwgt?**
> "It's the census sampling weight — how many people in the population that row represents. Not directly meaningful for predicting income, but the model found a weak signal in it."

**Q: Is this production ready?**
> "The CORS is currently set to allow all origins, which is fine for a demo. In production, you'd lock that down to the specific frontend URL and add authentication to the API."
