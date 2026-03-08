import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

DATA_FILE = 'data/crowd_training_data.csv'
MODEL_DIR = 'models'
MODEL_PATH = os.path.join(MODEL_DIR, 'crowd_model.pkl')
FEATURES_PATH = os.path.join(MODEL_DIR, 'crowd_features.pkl')

def ensure_model_dir():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)

def train_crowd_model():
    if not os.path.exists(DATA_FILE):
        print(f"Error: Training data not found at {DATA_FILE}")
        return

    print("Loading crowd data...")
    df = pd.read_csv(DATA_FILE, parse_dates=['timestamp'])
    
    # Optional filtering to remove extreme outliers if any exist
    df = df[df['occupancy_count'] >= 0]
    
    # 1. Select the relevant raw columns
    raw_features = ['route', 'hour', 'minute', 'day_of_week', 'is_weekend']
    X = df[raw_features]
    y = df['occupancy_percent']

    # 2. Convert 'route' (categorical string) into numbers using One-Hot Encoding
    print("Encoding route feature...")
    X = pd.get_dummies(X, columns=['route'], drop_first=False)
    
    # Save the exact feature column names so the API knows how to structure incoming requests
    features_list = list(X.columns)

    print("Splitting dataset into 80% Training and 20% Testing sets...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training Random Forest Regressor on {len(X_train)} training samples... (Testing on {len(X_test)} samples)")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        random_state=42,
        n_jobs=-1 # Use all CPU cores for faster training
    )
    
    model.fit(X_train, y_train)

    print("Evaluating model on 20% Testing set...")
    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print(f"Model Performance:")
    print(f"  MSE: {mse:.2f}")
    print(f"  R2 Score: {r2:.2f}")

    ensure_model_dir()
    joblib.dump(model, MODEL_PATH)
    joblib.dump(features_list, FEATURES_PATH)
    print(f"Model saved successfully to {MODEL_PATH}")
    print(f"Feature schema saved to {FEATURES_PATH}")

if __name__ == "__main__":
    train_crowd_model()
