import os
from dotenv import load_dotenv

# Base Directory paths
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_DIR = os.path.dirname(BACKEND_DIR)

# Load environment variables
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

# Search for models directory in multiple candidate locations
candidate_model_dirs = [
    os.path.join(PROJECT_DIR, 'models'),
    os.path.join(BACKEND_DIR, 'models'),
    os.path.join(APP_DIR, 'models'),
]

MODELS_DIR = candidate_model_dirs[0]
for d in candidate_model_dirs:
    if os.path.exists(os.path.join(d, 'carbon_emission_pipeline.joblib')):
        MODELS_DIR = d
        break

PIPELINE_PATH = os.path.join(MODELS_DIR, 'carbon_emission_pipeline.joblib')
METRICS_PATH = os.path.join(MODELS_DIR, 'metrics.json')
FEATURE_IMPORTANCE_PATH = os.path.join(MODELS_DIR, 'feature_importance.json')
