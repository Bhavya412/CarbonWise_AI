import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'carbon_emissions.csv')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

os.makedirs(MODELS_DIR, exist_ok=True)

CATEGORICAL_COLS = [
    'Body Type', 'Sex', 'Diet', 'How Often Shower', 'Heating Energy Source',
    'Transport', 'Vehicle Type', 'Social Activity', 'Frequency of Traveling by Air',
    'Waste Bag Size', 'Energy efficiency', 'Recycling', 'Cooking_With'
]

NUMERICAL_COLS = [
    'Monthly Grocery Bill', 'Vehicle Monthly Distance Km', 'Waste Bag Weekly Count',
    'How Long TV PC Daily Hour', 'How Many New Clothes Monthly', 'How Long Internet Daily Hour'
]

def preprocess_dataframe(df_input: pd.DataFrame) -> pd.DataFrame:
    """Preprocess raw DataFrame handling missing values and lists."""
    df_clean = df_input.copy()
    
    # Smart Vehicle Type Imputation
    if 'Vehicle Type' in df_clean.columns and 'Transport' in df_clean.columns:
        mask_non_private = (df_clean['Transport'] != 'private') & (
            df_clean['Vehicle Type'].isna() | 
            (df_clean['Vehicle Type'].astype(str).str.lower().isin(['none', 'nan', 'null', '']))
        )
        df_clean.loc[mask_non_private, 'Vehicle Type'] = 'Not Applicable'
        df_clean['Vehicle Type'] = df_clean['Vehicle Type'].fillna('missing')
    
    # Handle list formats for Recycling & Cooking_With
    for col in ['Recycling', 'Cooking_With']:
        if col in df_clean.columns:
            df_clean[col] = df_clean[col].apply(
                lambda x: str(sorted(x)) if isinstance(x, list) else str(x)
            )
            
    return df_clean

def main():
    print(f"Loading dataset from: {DATA_PATH}")
    df_raw = pd.read_csv(DATA_PATH)
    
    df_processed = preprocess_dataframe(df_raw)
    
    X = df_processed.drop(columns=['CarbonEmission'])
    y = df_processed['CarbonEmission']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ]), NUMERICAL_COLS),
            ('cat', Pipeline([
                ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ]), CATEGORICAL_COLS)
        ]
    )
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    models = {
        'LinearRegression': LinearRegression(),
        'RandomForestRegressor': RandomForestRegressor(n_estimators=100, random_state=42),
        'GradientBoostingRegressor': GradientBoostingRegressor(n_estimators=100, random_state=42)
    }
    
    metrics_summary = {"models": {}, "best_model": ""}
    trained_pipelines = {}
    best_model_name = None
    best_r2 = -float('inf')
    
    print("\n--- Training and Evaluating Models ---")
    for name, model in models.items():
        pipe = Pipeline([
            ('preprocessor', preprocessor),
            ('model', model)
        ])
        pipe.fit(X_train, y_train)
        preds = pipe.predict(X_test)
        
        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(root_mean_squared_error(y_test, preds))
        r2 = float(r2_score(y_test, preds))
        
        metrics_summary["models"][name] = {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4)
        }
        trained_pipelines[name] = pipe
        
        print(f"  {name:25s} | MAE: {mae:7.2f} | RMSE: {rmse:7.2f} | R²: {r2:.4f}")
        
        if r2 > best_r2:
            best_r2 = r2
            best_model_name = name

    metrics_summary["best_model"] = best_model_name
    print(f"\nBest Model Selected: {best_model_name} (R² = {best_r2:.4f})")
    
    # Save metrics
    metrics_path = os.path.join(MODELS_DIR, 'metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics_summary, f, indent=2)
    print(f"Saved evaluation metrics to: {metrics_path}")
    
    # Best pipeline export
    best_pipe = trained_pipelines[best_model_name]
    pipeline_path = os.path.join(MODELS_DIR, 'carbon_emission_pipeline.joblib')
    joblib.dump(best_pipe, pipeline_path)
    print(f"Saved ML pipeline to: {pipeline_path}")
    
    # Compute Feature Importances for Best Model
    best_model = best_pipe.named_steps['model']
    prep = best_pipe.named_steps['preprocessor']
    
    if hasattr(best_model, 'feature_importances_'):
        raw_importances = best_model.feature_importances_
    elif hasattr(best_model, 'coef_'):
        raw_importances = np.abs(best_model.coef_)
    else:
        raw_importances = np.zeros(len(NUMERICAL_COLS) + len(CATEGORICAL_COLS))
        
    ohe = prep.named_transformers_['cat'].named_steps['onehot']
    cat_feature_names = ohe.get_feature_names_out(CATEGORICAL_COLS)
    all_feature_names = list(NUMERICAL_COLS) + list(cat_feature_names)
    
    logical_importances = {}
    for feat, imp in zip(all_feature_names, raw_importances):
        base_feat = feat
        for orig_cat in CATEGORICAL_COLS:
            if feat.startswith(orig_cat + '_'):
                base_feat = orig_cat
                break
        logical_importances[base_feat] = logical_importances.get(base_feat, 0.0) + float(imp)
        
    total_imp = sum(logical_importances.values()) if sum(logical_importances.values()) > 0 else 1.0
    sorted_importances = {
        k: round((v / total_imp) * 100, 2)
        for k, v in sorted(logical_importances.items(), key=lambda item: item[1], reverse=True)
    }
    
    feature_imp_path = os.path.join(MODELS_DIR, 'feature_importance.json')
    with open(feature_imp_path, 'w') as f:
        json.dump(sorted_importances, f, indent=2)
    print(f"Saved feature importances to: {feature_imp_path}")
    print("\nTraining completed successfully!")

if __name__ == '__main__':
    main()
