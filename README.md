# CarbonWise AI — AI-Powered Carbon Emission Prediction & Sustainability Platform

**One-Line Description**:
"CarbonWise AI uses supervised machine learning to predict personal carbon emissions from 19 lifestyle and consumption patterns, identify influential factors, simulate alternative choices, and provide personalized sustainability guidance, with Google Gemini used as an optional Generative AI explanation layer."

Developed for the **1M1B AI for Sustainability Virtual Internship** • Primary Goal: **SDG 13 — Climate Action**.

---

## 1. Problem Statement
Individual lifestyle decisions involving transportation, energy, diet, shopping, waste management, and aviation contribute significantly to global greenhouse gas emissions. However, most individuals lack clear insights into how specific daily habits drive their carbon footprint or how alternative choices could reduce their personal emissions.

Traditional carbon calculators rely on static, deterministic formulas that do not learn complex multi-variable interactions or provide model-based scenario simulations.

---

## 2. Solution Overview
**CarbonWise AI** solves this problem by providing a lightweight machine learning platform that:
1. Learns carbon emission patterns from a benchmark dataset of 10,000 lifestyle records.
2. Predicts annual carbon emissions (in kg CO2e) using a trained Scikit-learn regression pipeline (`GradientBoostingRegressor`, R² = 0.9561).
3. Extracts transparent, aggregated model-native feature importances to show top emission drivers.
4. Generates personalized, prioritized sustainability recommendations tailored to user habits.
5. Enables interactive What-If scenario simulations to test lifestyle changes before committing.
6. Integrates Google Gemini (`google-genai` SDK) to conversationally explain predictions and answer sustainability questions (with automatic Demo Mode fallback).

---

## 3. Key Features
- **19-Feature Supervised ML Pipeline**: Fully preprocessed pipeline handling missing values (`Vehicle Type` imputation for non-private vs private transport), categorical one-hot encoding, and numerical scaling.
- **Model Evaluation Comparison**: Honest evaluation comparing Linear Regression, Random Forest Regressor, and Gradient Boosting Regressor.
- **Transparent Explainability**: Aggregates one-hot sub-feature importances back to logical feature names (e.g., `Vehicle Monthly Distance Km`: 37.83%, `Frequency of Traveling by Air`: 24.34%, `Vehicle Type`: 17.61%).
- **Interactive What-If Simulator**: Re-evaluates ML models on modified inputs to quantify reduction deltas (kg CO2e and percentage savings).
- **Grounded Gemini AI Layer**: Natural-language explanations grounded strictly in ML predictions and feature importances, ensuring Gemini cannot fabricate numerical outputs.
- **Decoupled Fallback**: Full system operates 100% independently of Gemini if API keys or network connection are unavailable.

---

## 4. AI/ML Architecture
```
USER INPUT (19 Lifestyle Features)
       ↓
Scikit-Learn Preprocessing Pipeline (SimpleImputer, OneHotEncoder, StandardScaler)
       ↓
Best Trained Model (GradientBoostingRegressor)
       ↓
┌──────────────────────────────────────────┬────────────────────────────────────────┐
│  Predicted Emission Score (kg CO2e/yr)   │  Logical Feature Importance Extraction │
└──────────────────────────────────────────┴────────────────────────────────────────┘
       ↓                                                   ↓
Personalized Recommendation Engine                  What-If Scenario Simulator
       ↓                                                   ↓
┌───────────────────────────────────────────────────────────────────────────────────┐
│               Optional Google Gemini Generative AI Explanation Layer              │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Dataset Description & Schema
- **File**: `data/carbon_emissions.csv` (10,000 rows x 20 columns)
- **Dataset Type Disclaimer**: Synthetically generated benchmark dataset using weightings informed by carbon-emission studies and existing calculation methodologies.
- **Input Features (19)**:
  - *Personal & Diet*: `Body Type`, `Sex`, `Diet`, `How Often Shower`, `Social Activity`, `Monthly Grocery Bill`
  - *Mobility & Travel*: `Transport`, `Vehicle Type`, `Vehicle Monthly Distance Km`, `Frequency of Traveling by Air`
  - *Energy & Appliances*: `Heating Energy Source`, `Energy efficiency`, `Cooking_With`
  - *Consumption & Waste*: `Waste Bag Size`, `Waste Bag Weekly Count`, `How Many New Clothes Monthly`, `How Long TV PC Daily Hour`, `How Long Internet Daily Hour`, `Recycling`
- **Target Variable**: `CarbonEmission` (Numerical integer, kg CO2e / year)

---

## 6. Model Evaluation Results
Models were evaluated on a 20% test split (2,000 records) using random_state=42:

| Model Name | MAE (kg CO2e) | RMSE (kg CO2e) | R² Score | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Gradient Boosting Regressor** | **160.84** | **213.69** | **0.9561** | **Best Selected Model** |
| Linear Regression | 175.63 | 261.61 | 0.9342 | Evaluated |
| Random Forest Regressor | 215.85 | 284.64 | 0.9221 | Evaluated |

*Saved Metrics Artifact*: `models/metrics.json`
*Saved Pipeline Binary*: `models/carbon_emission_pipeline.joblib`

---

## 7. Feature Importance Breakdown
Top logical feature importances calculated by the Gradient Boosting model:
1. **Vehicle Monthly Distance Km**: 37.83%
2. **Frequency of Traveling by Air**: 24.34%
3. **Vehicle Type**: 17.61%
4. **Body Type**: 4.26%
5. **How Many New Clothes Monthly**: 4.08%
6. **Sex**: 2.89%
7. **Waste Bag Weekly Count**: 2.78%
8. **Heating Energy Source**: 2.33%
9. **Waste Bag Size**: 2.09%

---

## 8. Responsible AI & Limitations
- **Fairness**: Demographics are restricted; predictions are strictly lifestyle-based and not used for high-stakes individual decisions.
- **Transparency**: Explaining predictions via native feature importances; Gemini is prohibited from altering ML values.
- **Privacy**: No PII is collected or stored in persistent databases.
- **Dataset Limitation**: Synthetically generated dataset used for internship benchmarking; predictions are statistical estimates.
- **See Full Documentation**: [`responsible_ai.md`](file:///c:/Users/bhavya/OneDrive/Desktop/Carbon_FootPrints_Project/responsible_ai.md)

---

## 9. Installation & Run Guide

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup & Training
```bash
# 1. Install Backend Dependencies
pip install -r backend/requirements.txt

# 2. Train ML Models & Export Pipeline Artifacts
python train.py

# 3. Run Backend Automated Tests
python -m pytest backend/tests

# 4. Start FastAPI Backend (Port 8000)
python -m uvicorn backend.app.main:app --reload --port 8000
```

### Start Frontend Client
```bash
# In a new terminal:
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 10. API Endpoints
- `GET /api/health`: Health status & pipeline load status
- `POST /api/ml/predict`: Compute prediction, top factors, recommendations & Gemini explanation
- `POST /api/ml/scenario`: Compare current vs scenario predictions and delta
- `GET /api/ml/metrics`: Return evaluated MAE, RMSE, R² scores
- `GET /api/ml/features`: Return logical feature importances
- `POST /api/assistant`: Interactive Gemini AI sustainability assistant



**Live Demo:** https://carbon-wise-ai-beta.vercel.app/
