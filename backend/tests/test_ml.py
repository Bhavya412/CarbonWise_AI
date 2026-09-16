import pytest
from app.ml_service import ml_service, CarbonAssessmentInput

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

def test_ml_pipeline_loaded():
    assert ml_service.pipeline is not None, "ML pipeline should be loaded."
    assert ml_service.model_name != "", "Model name should be set."

def test_predict_returns_valid_number(sample_input):
    prediction = ml_service.predict(sample_input)
    assert isinstance(prediction, float)
    assert prediction >= 0.0

def test_vehicle_type_imputation_non_private(sample_input):
    sample_input.transport = "walk/bicycle"
    sample_input.vehicle_type = None
    df = ml_service.format_input(sample_input)
    assert df.loc[0, "Vehicle Type"] == "Not Applicable"

def test_vehicle_type_imputation_private(sample_input):
    sample_input.transport = "private"
    sample_input.vehicle_type = "petrol"
    df = ml_service.format_input(sample_input)
    assert df.loc[0, "Vehicle Type"] == "petrol"
