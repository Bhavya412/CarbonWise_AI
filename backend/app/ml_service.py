import os
import json
import joblib
import pandas as pd
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.config import PIPELINE_PATH, METRICS_PATH, FEATURE_IMPORTANCE_PATH

class CarbonAssessmentInput(BaseModel):
    body_type: str = Field(..., json_schema_extra={"example": "overweight"})
    sex: str = Field(..., json_schema_extra={"example": "female"})
    diet: str = Field(..., json_schema_extra={"example": "pescatarian"})
    how_often_shower: str = Field(..., json_schema_extra={"example": "daily"})
    heating_energy_source: str = Field(..., json_schema_extra={"example": "coal"})
    transport: str = Field(..., json_schema_extra={"example": "public"})
    vehicle_type: Optional[str] = Field(default="Not Applicable", json_schema_extra={"example": "None"})
    social_activity: str = Field(..., json_schema_extra={"example": "often"})
    monthly_grocery_bill: float = Field(..., ge=0, json_schema_extra={"example": 230.0})
    frequency_of_traveling_by_air: str = Field(..., json_schema_extra={"example": "frequently"})
    vehicle_monthly_distance_km: float = Field(..., ge=0, json_schema_extra={"example": 210.0})
    waste_bag_size: str = Field(..., json_schema_extra={"example": "large"})
    waste_bag_weekly_count: int = Field(..., ge=0, json_schema_extra={"example": 4})
    how_long_tv_pc_daily_hour: float = Field(..., ge=0, le=24, json_schema_extra={"example": 7.0})
    how_many_new_clothes_monthly: int = Field(..., ge=0, json_schema_extra={"example": 26})
    how_long_internet_daily_hour: float = Field(..., ge=0, le=24, json_schema_extra={"example": 1.0})
    energy_efficiency: str = Field(..., json_schema_extra={"example": "No"})
    recycling: List[str] = Field(default_factory=list, json_schema_extra={"example": ["Metal"]})
    cooking_with: List[str] = Field(default_factory=list, json_schema_extra={"example": ["Stove", "Oven"]})

class ScenarioInput(BaseModel):
    current: CarbonAssessmentInput
    scenario: CarbonAssessmentInput

class MLService:
    def __init__(self):
        self.pipeline = None
        self.metrics = {}
        self.feature_importance = {}
        self.model_name = "GradientBoostingRegressor"
        self._load_artifacts()

    def _load_artifacts(self):
        if os.path.exists(PIPELINE_PATH):
            self.pipeline = joblib.load(PIPELINE_PATH)
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, 'r') as f:
                self.metrics = json.load(f)
                self.model_name = self.metrics.get('best_model', self.model_name)
        if os.path.exists(FEATURE_IMPORTANCE_PATH):
            with open(FEATURE_IMPORTANCE_PATH, 'r') as f:
                self.feature_importance = json.load(f)

    def format_input(self, inp: CarbonAssessmentInput) -> pd.DataFrame:
        # Determine Vehicle Type logic: 'Not Applicable' if not private transport
        v_type = inp.vehicle_type
        if inp.transport != 'private':
            v_type = 'Not Applicable'
        elif not v_type or str(v_type).lower() in ['none', 'nan', 'null', '']:
            v_type = 'missing'

        rec_str = str(sorted(inp.recycling)) if isinstance(inp.recycling, list) else str(inp.recycling)
        cook_str = str(sorted(inp.cooking_with)) if isinstance(inp.cooking_with, list) else str(inp.cooking_with)

        data_dict = {
            'Body Type': [inp.body_type],
            'Sex': [inp.sex],
            'Diet': [inp.diet],
            'How Often Shower': [inp.how_often_shower],
            'Heating Energy Source': [inp.heating_energy_source],
            'Transport': [inp.transport],
            'Vehicle Type': [v_type],
            'Social Activity': [inp.social_activity],
            'Monthly Grocery Bill': [inp.monthly_grocery_bill],
            'Frequency of Traveling by Air': [inp.frequency_of_traveling_by_air],
            'Vehicle Monthly Distance Km': [inp.vehicle_monthly_distance_km],
            'Waste Bag Size': [inp.waste_bag_size],
            'Waste Bag Weekly Count': [inp.waste_bag_weekly_count],
            'How Long TV PC Daily Hour': [inp.how_long_tv_pc_daily_hour],
            'How Many New Clothes Monthly': [inp.how_many_new_clothes_monthly],
            'How Long Internet Daily Hour': [inp.how_long_internet_daily_hour],
            'Energy efficiency': [inp.energy_efficiency],
            'Recycling': [rec_str],
            'Cooking_With': [cook_str]
        }
        return pd.DataFrame(data_dict)

    def predict(self, inp: CarbonAssessmentInput) -> float:
        if self.pipeline is None:
            self._load_artifacts()
            if self.pipeline is None:
                raise ValueError("ML Pipeline file not found. Run python train.py first.")

        df_single = self.format_input(inp)
        pred = float(self.pipeline.predict(df_single)[0])
        return max(0.0, round(pred, 2))

    def get_metrics(self) -> Dict[str, Any]:
        return self.metrics

    def get_feature_importance(self) -> Dict[str, float]:
        return self.feature_importance

ml_service = MLService()
