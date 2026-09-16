import os
from dotenv import load_dotenv

# Base Directory paths
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_DIR = os.path.dirname(BACKEND_DIR)

# Load environment variables
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

MODELS_DIR = os.path.join(PROJECT_DIR, 'models')
PIPELINE_PATH = os.path.join(MODELS_DIR, 'carbon_emission_pipeline.joblib')
METRICS_PATH = os.path.join(MODELS_DIR, 'metrics.json')
FEATURE_IMPORTANCE_PATH = os.path.join(MODELS_DIR, 'feature_importance.json')
