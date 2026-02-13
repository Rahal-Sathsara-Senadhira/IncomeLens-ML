from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    features: Dict[str, Any] = Field(default_factory=dict)


class PredictResponse(BaseModel):
    label: str
    probability: Optional[float] = None
    threshold: float
    positive_label: str
    model: str
    top_factors: Optional[list[dict]] = None


class HealthResponse(BaseModel):
    status: str
    loaded: bool
    model: Optional[str] = None


class SchemaResponse(BaseModel):
    expected_features: list[str]
    target_column: str
    positive_label: str
    label_mapping: dict
