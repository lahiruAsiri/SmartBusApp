import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

DATA_FILE = 'data/crowd_training_data.csv'
MODEL_DIR = 'models'
MODEL_PATH = os.path.join(MODEL_DIR, 'crowd_model.pkl')

def ensure_model_dir():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)

def train_crowd_model():
    if not os.path.exists(DATA_FILE):
        print(f"Error: Training data not found at {DATA_FILE}")
        return

    print("Loading crowd data...")
    df = pd.read_csv(DATA_FILE, parse_dates=['timestamp'])
    
    # Features (X) and Target (y)
    # Using simple temporal features for the demo
    X = df[['hour', 'minute', 'day_of_week', 'is_weekend']]
    y = df['occupancy_percent']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training Random Forest Regressor on {len(X_train)} samples...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        random_state=42
    )
    
    model.fit(X_train, y_train)

    print("Evaluating model...")
    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print(f"Model Performance:")
    print(f"  MSE: {mse:.2f}")
    print(f"  R2 Score: {r2:.2f}")

    ensure_model_dir()
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved successfully to {MODEL_PATH}")

if __name__ == "__main__":
    train_crowd_model()
