import os
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.ml_service import ml_service, CarbonAssessmentInput, ScenarioInput
from app.recommendation_service import recommendation_service
from app.gemini_service import gemini_service

app = FastAPI(
    title="CarbonWise AI API",
    description="AI-Powered Carbon Emission Prediction and Sustainability Recommendation Platform",
    version="1.0.0"
)

# Enable CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AssistantRequest(BaseModel):
    question: str
    context: Optional[Dict[str, Any]] = None

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "CarbonWise AI Backend",
        "version": "1.0.0",
        "model_loaded": ml_service.pipeline is not None
    }

@app.post("/api/ml/predict")
def predict_emission(inp: CarbonAssessmentInput):
    try:
        predicted_val = ml_service.predict(inp)
        feat_imp = ml_service.get_feature_importance()
        
        top_factors = [
            {"feature": k, "importance": v}
            for k, v in list(feat_imp.items())[:5]
        ]
        
        recs = recommendation_service.generate_recommendations(
            inp=inp,
            predicted_emission=predicted_val,
            feature_importance=feat_imp
        )
        
        ai_exp = gemini_service.explain_prediction(
            inp=inp,
            predicted_emission=predicted_val,
            model_name=ml_service.model_name,
            feature_importance=feat_imp,
            recommendations=recs
        )
        
        return {
            "predicted_carbon_emission": predicted_val,
            "unit": "kg CO2e",
            "model": ml_service.model_name,
            "top_factors": top_factors,
            "recommendations": recs,
            "ai_explanation": ai_exp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/scenario")
def scenario_simulation(scenario_req: ScenarioInput):
    try:
        current_pred = ml_service.predict(scenario_req.current)
        scenario_pred = ml_service.predict(scenario_req.scenario)
        
        diff = round(current_pred - scenario_pred, 2)
        pct_change = round((diff / current_pred * 100), 2) if current_pred > 0 else 0.0
        
        direction = "reduction" if diff >= 0 else "increase"
        explanation = (
            f"Changing your lifestyle parameters results in a predicted annual carbon "
            f"{direction} of {abs(diff)} kg CO2e ({abs(pct_change)}%). "
            f"Current prediction: {current_pred} kg CO2e vs. Scenario prediction: {scenario_pred} kg CO2e."
        )
        
        return {
            "current_prediction": current_pred,
            "scenario_prediction": scenario_pred,
            "difference": diff,
            "percentage_change": pct_change,
            "unit": "kg CO2e",
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/metrics")
def get_metrics():
    metrics = ml_service.get_metrics()
    if not metrics:
        raise HTTPException(status_code=404, detail="Metrics file not found. Run python train.py first.")
    return metrics

@app.get("/api/ml/features")
def get_feature_importance():
    feats = ml_service.get_feature_importance()
    if not feats:
        raise HTTPException(status_code=404, detail="Feature importance file not found. Run python train.py first.")
    return feats

@app.post("/api/assistant")
def assistant_chat(req: AssistantRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
        
    answer = gemini_service.answer_question(
        question=req.question,
        context=req.context
    )
    return {"answer": answer}
