from typing import List, Dict, Any
from app.ml_service import CarbonAssessmentInput

class RecommendationService:
    def generate_recommendations(
        self,
        inp: CarbonAssessmentInput,
        predicted_emission: float,
        feature_importance: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        recommendations = []

        # 1. Aviation & Travel
        if inp.frequency_of_traveling_by_air in ['very frequently', 'frequently']:
            recommendations.append({
                "category": "Transportation & Aviation",
                "priority": "High",
                "impact": "High (up to 800-1500 kg CO2e/yr savings)",
                "title": "Optimize Air Travel Habits",
                "description": "Air travel is one of the highest contributors to personal carbon emissions. Consider combining trips, opting for rail on regional travel, or utilizing virtual meetings where feasible."
            })

        # 2. Private Vehicle & Distance
        if inp.transport == 'private' and inp.vehicle_monthly_distance_km > 500:
            v_type_note = f" (Current: {inp.vehicle_type})" if inp.vehicle_type else ""
            recommendations.append({
                "category": "Transportation",
                "priority": "High",
                "impact": "Medium-High (300-900 kg CO2e/yr savings)",
                "title": f"Reduce Personal Vehicle Mileage{v_type_note}",
                "description": f"You drive approximately {inp.vehicle_monthly_distance_km} km monthly. Shifting 2 days of commuting to public transit or carpooling can substantially cut transport emissions."
            })

        # 3. Heating Energy Source
        if inp.heating_energy_source in ['coal', 'wood']:
            recommendations.append({
                "category": "Home Energy",
                "priority": "High",
                "impact": "High (500-1200 kg CO2e/yr savings)",
                "title": "Upgrade Home Heating Efficiency",
                "description": f"Heating using {inp.heating_energy_source} generates high localized emissions. Exploring heat pumps or renewable electricity sources dramatically lowers carbon output."
            })

        # 4. Waste & Consumption
        if inp.waste_bag_weekly_count >= 4 or inp.waste_bag_size in ['large', 'extra large']:
            recommendations.append({
                "category": "Waste & Circularity",
                "priority": "Medium",
                "impact": "Medium (150-400 kg CO2e/yr savings)",
                "title": "Improve Waste Reduction & Recycling",
                "description": f"You dispose of {inp.waste_bag_weekly_count} {inp.waste_bag_size} waste bags weekly. Composting food scraps and maximizing plastic/metal recycling reduces landfill methane emissions."
            })

        # 5. Diet & Agriculture
        if inp.diet in ['omnivore', 'pescatarian']:
            recommendations.append({
                "category": "Diet & Food",
                "priority": "Medium",
                "impact": "Medium (200-500 kg CO2e/yr savings)",
                "title": "Adopt Plant-Forward Meal Habits",
                "description": "Incorporating 2-3 plant-based days per week reduces livestock-related emissions without requiring complete dietary transformation."
            })

        # 6. Fashion & Shopping
        if inp.how_many_new_clothes_monthly > 10:
            recommendations.append({
                "category": "Shopping & Fashion",
                "priority": "Medium",
                "impact": "Low-Medium (100-300 kg CO2e/yr savings)",
                "title": "Embrace Sustainable Apparel Choices",
                "description": f"Purchasing {inp.how_many_new_clothes_monthly} new clothing items monthly contributes to textile waste. Exploring thrifting, high-quality durable garments, or capsule wardrobes lowers footprint."
            })

        # 7. Home Energy Efficiency
        if inp.energy_efficiency in ['No', 'Sometimes']:
            recommendations.append({
                "category": "Home Energy",
                "priority": "Low",
                "impact": "Low-Medium (100-250 kg CO2e/yr savings)",
                "title": "Enhance Household Energy Conservation",
                "description": "Switching to LED lights, unplugging idle electronics, and installing smart plugs optimizes daily power utilization."
            })

        # Ensure at least 2 general recommendations if user already has low impact
        if len(recommendations) < 2:
            recommendations.append({
                "category": "General Sustainability",
                "priority": "Low",
                "impact": "General Guidance",
                "title": "Maintain Sustainable Lifestyle Habits",
                "description": "Your current reported consumption reflects strong baseline eco-efficiency. Continue auditing seasonal energy use and encouraging sustainable practices in your community."
            })

        return recommendations

recommendation_service = RecommendationService()
