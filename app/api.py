"""
FastAPI endpoints for payment delay predictions
Provides REST interface for model inference
"""

from fastapi import FastAPI

app = FastAPI(title="B2B Payment Delay Predictor")


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/predict")
def predict_payment_delay(invoice_data: dict):
    """Predict payment delay for an invoice"""
    pass
