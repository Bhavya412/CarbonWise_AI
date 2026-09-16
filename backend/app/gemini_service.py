import os
import logging
from typing import Dict, Any, Optional, List
from app.config import GEMINI_API_KEY
from app.ml_service import CarbonAssessmentInput

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.client = None
        self.model_candidates = [
            "gemini-3.5-flash-lite",
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.1-flash-lite"
        ]
        self._init_client()

    def _init_client(self):
        if GEMINI_API_KEY and GEMINI_API_KEY.strip():
            try:
                from google import genai
                self.client = genai.Client(api_key=GEMINI_API_KEY.strip())
            except Exception as e:
                logger.warning(f"Failed to initialize Google GenAI client: {e}")
                self.client = None

    def explain_prediction(
        self,
        inp: CarbonAssessmentInput,
        predicted_emission: float,
        model_name: str,
        feature_importance: Dict[str, float],
        recommendations: List[Dict[str, Any]]
    ) -> str:
        """Generate conversational explanation of ML model prediction using Gemini."""
        if not self.client:
            return self._fallback_explanation(predicted_emission, model_name, feature_importance)

        top_factors = list(feature_importance.items())[:3]
        top_factors_str = ", ".join([f"{k} ({v}%)" for k, v in top_factors])
        recs_str = "\n".join([f"- {r['title']}: {r['description']}" for r in recommendations[:3]])

        prompt = f"""
You are CarbonWise AI's Sustainability Assistant.
Explain the following carbon emission prediction grounded strictly in the provided ML output:

- ML Predicted Annual Carbon Emission: {predicted_emission} kg CO2e
- Model Used: {model_name}
- Top Driving Features: {top_factors_str}
- Key User Lifestyle Inputs:
  * Transport Mode: {inp.transport} (Vehicle Type: {inp.vehicle_type}, Monthly Km: {inp.vehicle_monthly_distance_km})
  * Air Travel Frequency: {inp.frequency_of_traveling_by_air}
  * Diet: {inp.diet}
  * Heating Energy Source: {inp.heating_energy_source}
  * Waste Bags Weekly: {inp.waste_bag_weekly_count} ({inp.waste_bag_size})

Key Personalized Recommendations:
{recs_str}

Instruction:
Provide a clear, encouraging, non-judgmental 2-paragraph summary explaining:
1. What this emission score means and why the top features drove this result.
2. How the key recommendations can realistically help reduce their footprint.
Do NOT invent new numerical emission metrics.
"""
        for m_name in self.model_candidates:
            try:
                response = self.client.models.generate_content(
                    model=m_name,
                    contents=prompt
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini API model {m_name} failed: {e}")

        return self._fallback_explanation(predicted_emission, model_name, feature_importance)

    def answer_question(self, question: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Answer user questions conversationally based on lifestyle and prediction context."""
        if not self.client:
            return self._fallback_answer(question)

        ctx_str = ""
        if context:
            ctx_str = f"User Context:\n- Predicted Emission: {context.get('predicted_emission')} kg CO2e\n- Top Factors: {context.get('top_factors')}"

        prompt = f"""
You are CarbonWise AI, an expert AI sustainability assistant.
Answer the user's question clearly, concisely, and practically.

{ctx_str}

User Question: "{question}"

Instructions:
- Provide helpful, practical, and eco-friendly advice addressing the question directly.
- Keep the response concise (2-4 bullet points or short paragraphs).
- Align with Sustainable Development Goal 13 (Climate Action).
"""
        for m_name in self.model_candidates:
            try:
                response = self.client.models.generate_content(
                    model=m_name,
                    contents=prompt
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini API assistant model {m_name} failed: {e}")

        return self._fallback_answer(question)

    def _fallback_explanation(self, prediction: float, model: str, importance: Dict[str, float]) -> str:
        top_factors = list(importance.items())[:3]
        top_str = ", ".join([f"{k} ({v}%)" for k, v in top_factors]) if top_factors else "Transportation and Home Energy"
        return (
            f"Your estimated annual carbon footprint is {prediction} kg CO2e. "
            f"Based on your assessment, the primary factors shaping your footprint are {top_str}. "
            f"Focusing on high-impact areas like travel distance, flight frequency, and heating energy source offers the greatest opportunity for emission reduction."
        )

    def _fallback_answer(self, question: str) -> str:
        q_lower = question.lower()

        # Check for AI / Artificial Intelligence queries
        if any(w in q_lower for w in ["what is ai", "tell me what is ai", "artificial intelligence", "what's ai"]):
            return (
                "Artificial Intelligence (AI) refers to computer systems engineered to perform tasks that typically "
                "require human intelligence—such as learning, pattern recognition, and predictive modeling. "
                "In CarbonWise AI, machine learning regression models predict your carbon emissions, while Generative AI "
                "translates complex data into personalized climate action advice."
            )
        # General carbon footprint questions (must contain carbon or footprint or emission)
        elif any(w in q_lower for w in ["carbon", "footprint", "emission", "emissions", "climate", "sustainability"]) and any(w in q_lower for w in ["what is", "explain", "tell me", "meaning", "definition", "about"]):
            return (
                "A carbon footprint is the total amount of greenhouse gases (primarily carbon dioxide and methane) "
                "generated by human activities, measured in kilograms or tonnes of CO2 equivalent (kg CO2e) per year. "
                "The major components of an individual footprint include transportation, home energy use, food consumption, "
                "shopping/clothing, and air travel."
            )
        # Transportation specific
        elif any(w in q_lower for w in ["car", "cars", "driving", "drive", "vehicle", "transport", "transit", "commute"]):
            return (
                "Transportation accounts for nearly 40% of typical personal carbon footprints. "
                "Reducing vehicle travel by carpooling, using public transit, active commuting (biking/walking), "
                "or switching to an electric vehicle significantly lowers combustion emissions."
            )
        # Diet / Food specific
        elif any(w in q_lower for w in ["diet", "food", "eat", "eating", "meat", "vegan", "vegetarian"]):
            return (
                "Food supply chains generate up to 25% of global greenhouse emissions. "
                "Shifting toward a plant-forward or vegetarian diet reduces methane emissions from livestock "
                "and lowers the carbon footprint of agricultural transport and deforestation."
            )
        # Aviation specific
        elif any(w in q_lower for w in ["flight", "flights", "fly", "flying", "plane", "airplane", "air travel"]):
            return (
                "Aviation is one of the most carbon-intensive activities per passenger-kilometer. "
                "Reducing non-essential flights, choosing direct routes, or substituting train travel for short-haul trips "
                "has an immediate positive impact on your annual footprint."
            )
        # Energy specific
        elif any(w in q_lower for w in ["heat", "heating", "energy", "electricity", "solar", "power", "grid"]):
            return (
                "Home heating and electricity account for substantial emissions depending on your local energy grid. "
                "Improving insulation, lowering thermostat settings in winter, and transitioning to heat pumps or solar energy "
                "substantially lowers household carbon output."
            )
        return (
            f"Regarding your query on '{question}':\n"
            f"CarbonWise AI helps you understand and reduce personal greenhouse gas emissions across transportation, diet, home energy, and shopping. "
            f"For live dynamic answers on any general topic powered by Google Gemini, please ensure a valid GEMINI_API_KEY is configured in backend/.env."
        )

gemini_service = GeminiService()
