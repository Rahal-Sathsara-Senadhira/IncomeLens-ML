export function guessInputType(featureName) {
  const lower = featureName.toLowerCase();
  const numericHints = [
    "age",
    "hours",
    "capital",
    "fnlwgt",
    "education-num",
    "education_num",
    "education.num",
    "gain",
    "loss",
    "per-week",
    "per_week",
    "per.week",
    "num",
    "count",
  ];
  return numericHints.some((h) => lower.includes(h)) ? "number" : "text";
}
