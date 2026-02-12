from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    """
    Send features as a JSON object. Example:
    {
      "features": {
        "age": 37,
        "workclass": "Private",
        "education": "Bachelors",
        ...
      }
    }
    """
    features: Dict[str, Any] = Field(default_factory=dict)


class PredictResponse(BaseModel):
    label: str
    probability: Optional[float] = None
    threshold: float
    positive_label: str
    model_name: str
    top_factors: Optional[list[dict]] = None  # [{feature, weight}] or [{feature, importance}]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: Optional[str] = None


class SchemaResponse(BaseModel):
    expected_features: list[str]
    target_column: str
    positive_label: str
    label_mapping: dict
