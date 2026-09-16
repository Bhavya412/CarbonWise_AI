import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def valid_assessment_payload():
    return {
        "body_type": "overweight",
        "sex": "female",
        "diet": "pescatarian",
        "how_often_shower": "daily",
        "heating_energy_source": "coal",
        "transport": "public",
        "vehicle_type": "Not Applicable",
        "social_activity": "often",
        "monthly_grocery_bill": 230.0,
        "frequency_of_traveling_by_air": "frequently",
        "vehicle_monthly_distance_km": 210.0,
        "waste_bag_size": "large",
        "waste_bag_weekly_count": 4,
        "how_long_tv_pc_daily_hour": 7.0,
        "how_many_new_clothes_monthly": 26,
        "how_long_internet_daily_hour": 1.0,
        "energy_efficiency": "No",
        "recycling": ["Metal"],
        "cooking_with": ["Stove", "Oven"]
    }

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data

def test_predict_endpoint_valid(valid_assessment_payload):
    response = client.post("/api/ml/predict", json=valid_assessment_payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_carbon_emission" in data
    assert "top_factors" in data
    assert "recommendations" in data
    assert "ai_explanation" in data
    assert isinstance(data["predicted_carbon_emission"], (int, float))

def test_predict_endpoint_missing_field(valid_assessment_payload):
    payload = valid_assessment_payload.copy()
    del payload["transport"]
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 422  # Validation Error

def test_predict_endpoint_invalid_numerical(valid_assessment_payload):
    payload = valid_assessment_payload.copy()
    payload["monthly_grocery_bill"] = -100.0
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 422

def test_scenario_endpoint(valid_assessment_payload):
    scenario_payload = valid_assessment_payload.copy()
    scenario_payload["transport"] = "private"
    scenario_payload["vehicle_type"] = "petrol"
    scenario_payload["frequency_of_traveling_by_air"] = "rarely"

    req_payload = {
        "current": valid_assessment_payload,
        "scenario": scenario_payload
    }
    response = client.post("/api/ml/scenario", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert "current_prediction" in data
    assert "scenario_prediction" in data
    assert "difference" in data

def test_metrics_endpoint():
    response = client.get("/api/ml/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "best_model" in data

def test_features_endpoint():
    response = client.get("/api/ml/features")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert len(data) > 0
