from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.ml import bundle
from app.schemas import HealthResponse, PredictRequest, PredictResponse, SchemaResponse

app = FastAPI(
    title="IncomeLens ML API",
    version="1.0.0",
    description="Predict income class (<=50K vs >50K) from census-like attributes.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for production: set exact frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        loaded=bundle.loaded,
        model=bundle.model_name if bundle.loaded else None,
    )


@app.get("/schema", response_model=SchemaResponse)
def schema():
    if not bundle.loaded:
        raise HTTPException(status_code=503, detail="Model not loaded. Train the model first.")
    return SchemaResponse(
        expected_features=bundle.expected_features,
        target_column=bundle.target_column,
        positive_label=bundle.positive_label,
        label_mapping=bundle.label_mapping,
    )


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not bundle.loaded:
        raise HTTPException(status_code=503, detail="Model not loaded. Train the model first.")

    try:
        out = bundle.predict(req.features)
        return PredictResponse(**out)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")
