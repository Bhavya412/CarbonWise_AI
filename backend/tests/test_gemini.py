import pytest
from app.gemini_service import gemini_service
from app.ml_service import CarbonAssessmentInput

@pytest.fixture
def sample_input():
    return CarbonAssessmentInput(
        body_type="overweight",
        sex="female",
        diet="pescatarian",
        how_often_shower="daily",
        heating_energy_source="coal",
        transport="public",
        vehicle_type="Not Applicable",
        social_activity="often",
        monthly_grocery_bill=230.0,
        frequency_of_traveling_by_air="frequently",
        vehicle_monthly_distance_km=210.0,
        waste_bag_size="large",
        waste_bag_weekly_count=4,
        how_long_tv_pc_daily_hour=7.0,
        how_many_new_clothes_monthly=26,
        how_long_internet_daily_hour=1.0,
        energy_efficiency="No",
        recycling=["Metal"],
        cooking_with=["Stove", "Oven"]
    )

def test_explain_prediction_returns_string(sample_input):
    explanation = gemini_service.explain_prediction(
        inp=sample_input,
        predicted_emission=2238.0,
        model_name="GradientBoostingRegressor",
        feature_importance={"Vehicle Monthly Distance Km": 37.83, "Frequency of Traveling by Air": 24.34},
        recommendations=[{"title": "Reduce driving", "description": "Car pool"}]
    )
    assert isinstance(explanation, str)
    assert len(explanation) > 10

def test_answer_question_returns_string():
    answer = gemini_service.answer_question("How can I reduce my carbon footprint?")
    assert isinstance(answer, str)
    assert len(answer) > 10

def test_fallback_mode_when_client_none(sample_input):
    # Temporarily set client to None to test fallback
    orig_client = gemini_service.client
    gemini_service.client = None
    
    fallback_exp = gemini_service.explain_prediction(
        inp=sample_input,
        predicted_emission=2238.0,
        model_name="GradientBoostingRegressor",
        feature_importance={"Vehicle Monthly Distance Km": 37.83},
        recommendations=[]
    )
    assert "Your estimated annual carbon footprint" in fallback_exp
    
    fallback_ans = gemini_service.answer_question("Test question?")
    assert "Thank you for asking about" in fallback_ans
    
    # Restore client
    gemini_service.client = orig_client
