import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

DATA_FILE = 'data/eta_training_data.csv'
MODEL_DIR = 'models'
MODEL_PATH = os.path.join(MODEL_DIR, 'eta_xgboost_model.pkl')

def ensure_model_dir():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)

def train_eta_model():
    if not os.path.exists(DATA_FILE):
        print(f"Error: Training data not found at {DATA_FILE}")
        return

    print("Loading ETA data...")
    df = pd.read_csv(DATA_FILE)
    
    # Drop rows where we couldn't calculate delay
    df = df.dropna(subset=['delay_seconds', 'distance_meters', 'speed'])

    # Features (X)
    # We use current state + context to predict the error (delay) of the generic physics formula
    features = [
        'lat', 'lng', 
        'speed', 
        'hour', 'day_of_week', 'is_weekend',
        'distance_meters', 'theoretical_time_seconds'
    ]
    X = df[features]
    
    # Target (y) - The Delay (Residual)
    y = df['delay_seconds']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training XGBoost Regressor on {len(X_train)} distance/delay samples...")
    
    # Initialize XGBoost Regressor
    # Optimized for tabular data and small/medium datasets
    model = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=150,
        learning_rate=0.1,
        max_depth=6,
        random_state=42
    )
    
    model.fit(X_train, y_train)

    print("Evaluating model...")
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print(f"Model Performance (Predicting Error/Delay):")
    print(f"  Mean Absolute Error: {mae:.2f} seconds")
    print(f"  R2 Score: {r2:.2f}")

    ensure_model_dir()
    joblib.dump(model, MODEL_PATH)
    # Also save feature names so API knows what to pass
    joblib.dump(features, os.path.join(MODEL_DIR, 'eta_features.pkl'))
    print(f"Model saved successfully to {MODEL_PATH}")

if __name__ == "__main__":
    train_eta_model()
