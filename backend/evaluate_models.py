import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, confusion_matrix, classification_report, roc_curve, auc, accuracy_score
from sklearn.preprocessing import label_binarize
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor
import os

GRAPHS_DIR = 'graphs'

def ensure_graphs_dir():
    if not os.path.exists(GRAPHS_DIR):
        os.makedirs(GRAPHS_DIR)

def evaluate_crowd_model():
    print("Evaluating Crowd Model...")
    df = pd.read_csv('data/crowd_training_data.csv', parse_dates=['timestamp'])
    df = df[df['occupancy_count'] >= 0]
    
    X = df[['route', 'hour', 'minute', 'day_of_week', 'is_weekend']]
    y = df['occupancy_percent']
    X = pd.get_dummies(X, columns=['route'], drop_first=False)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    # 1. Accuracy Comparison (Actual vs Predicted Scatter)
    plt.figure(figsize=(10, 6))
    plt.scatter(y_test, y_pred, alpha=0.3, color='blue')
    plt.plot([0, 100], [0, 100], 'r--')
    plt.xlabel('Actual Crowd %')
    plt.ylabel('Predicted Crowd %')
    plt.title(f'Crowd Model: Actual vs Predicted (R2: {r2_score(y_test, y_pred):.2f})')
    plt.savefig(os.path.join(GRAPHS_DIR, 'crowd_accuracy.png'))
    plt.close()
    
    # 2. Feature Importance
    importances = model.feature_importances_
    n_features = min(10, len(importances))
    indices = np.argsort(importances)[::-1][:n_features]
    features = X.columns
    
    plt.figure(figsize=(12, 6))
    plt.title(f"Crowd Model: Top {n_features} Feature Importances")
    plt.bar(range(n_features), importances[indices], align="center")
    plt.xticks(range(n_features), [features[i] for i in indices], rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPHS_DIR, 'crowd_feature_importance.png'))
    plt.close()

    # Classification Conversion for Crowd:
    # 0-33%: Empty, 33-66%: Normal, 66-100%: Crowded
    def categorize_crowd(val):
        if val <= 33: return 0 # Empty
        if val <= 66: return 1 # Normal
        return 2               # Crowded
        
    y_test_class = y_test.apply(categorize_crowd)
    y_pred_class = pd.Series(y_pred).apply(categorize_crowd)
    
    # Calculate Overall Accuracy Percentage
    crowd_accuracy = accuracy_score(y_test_class, y_pred_class) * 100
    print(f"  Overall Crowd Classification Accuracy: {crowd_accuracy:.2f}%\n")
    
    # 3. Confusion Matrix
    cm = confusion_matrix(y_test_class, y_pred_class)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=['Empty', 'Normal', 'Crowded'],
                yticklabels=['Empty', 'Normal', 'Crowded'])
    plt.xlabel('Predicted Class')
    plt.ylabel('True Class')
    plt.title('Crowd Model: Confusion Matrix')
    plt.savefig(os.path.join(GRAPHS_DIR, 'crowd_confusion_matrix.png'))
    plt.close()
    
    # 4 & 5. Classification Report (F1 Scores)
    report = classification_report(y_test_class, y_pred_class, target_names=['Empty', 'Normal', 'Crowded'], output_dict=True)
    f1_scores = [report['Empty']['f1-score'], report['Normal']['f1-score'], report['Crowded']['f1-score']]
    
    plt.figure(figsize=(8, 5))
    plt.bar(['Empty', 'Normal', 'Crowded'], f1_scores, color=['green', 'orange', 'red'])
    plt.ylim(0, 1.1)
    plt.title('Crowd Model: F1 Score Comparison by Class')
    plt.ylabel('F1 Score')
    plt.savefig(os.path.join(GRAPHS_DIR, 'crowd_f1_scores.png'))
    plt.close()

def evaluate_eta_model():
    print("Evaluating ETA Model...")
    df = pd.read_csv('data/eta_training_data.csv')
    df = df.dropna(subset=['delay_seconds', 'distance_meters', 'speed'])
    
    raw_features = ['route', 'lat', 'lng', 'speed', 'hour', 'day_of_week', 'is_weekend', 'distance_meters', 'theoretical_time_seconds']
    X = df[raw_features]
    y = df['delay_seconds']
    X = pd.get_dummies(X, columns=['route'], drop_first=False)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=150, learning_rate=0.1, max_depth=6, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    # 1. Accuracy
    plt.figure(figsize=(10, 6))
    plt.scatter(y_test, y_pred, alpha=0.3, color='purple')
    
    # Line of perfect prediction
    min_val = min(y_test.min(), y_pred.min())
    max_val = max(y_test.max(), y_pred.max())
    plt.plot([min_val, max_val], [min_val, max_val], 'r--')
    
    plt.xlabel('Actual Delay (seconds)')
    plt.ylabel('Predicted Delay (seconds)')
    plt.title(f'ETA Model: Actual vs Predicted Delay (MAE: {mean_absolute_error(y_test, y_pred):.2f}s)')
    plt.savefig(os.path.join(GRAPHS_DIR, 'eta_accuracy.png'))
    plt.close()
    
    # 2. Feature Importance
    importances = model.feature_importances_
    n_features = min(10, len(importances))
    indices = np.argsort(importances)[::-1][:n_features]
    features = X.columns
    
    plt.figure(figsize=(12, 6))
    plt.title(f"ETA Model: Top {n_features} Feature Importances")
    plt.bar(range(n_features), importances[indices], align="center", color='purple')
    plt.xticks(range(n_features), [features[i] for i in indices], rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPHS_DIR, 'eta_feature_importance.png'))
    plt.close()

    # Classification Conversion for ETA:
    # < 30s: On Time, 30s-120s: Slight Delay, > 120s: Heavy Delay
    def categorize_delay(val):
        if val < 30: return 0  # On Time
        if val <= 120: return 1 # Slight Delay
        return 2               # Heavy Delay
        
    y_test_class = y_test.apply(categorize_delay)
    y_pred_class = pd.Series(y_pred).apply(categorize_delay)
    
    # Calculate Overall Accuracy Percentage
    eta_accuracy = accuracy_score(y_test_class, y_pred_class) * 100
    print(f"  Overall ETA Classification Accuracy: {eta_accuracy:.2f}%\n")
    
    # 3. Confusion Matrix
    cm = confusion_matrix(y_test_class, y_pred_class)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Purples', 
                xticklabels=['On Time', 'Slight Delay', 'Heavy Delay'],
                yticklabels=['On Time', 'Slight Delay', 'Heavy Delay'])
    plt.xlabel('Predicted Class')
    plt.ylabel('True Class')
    plt.title('ETA Model: Delay Class Confusion Matrix')
    plt.savefig(os.path.join(GRAPHS_DIR, 'eta_confusion_matrix.png'))
    plt.close()
    
    # 4. ROC Curve (For ETA "Heavy Delay" vs Rest)
    # We will treat "Heavy Delay" (2) as the positive class to generate an ROC curve
    y_test_binary = (y_test_class == 2).astype(int)
    # Get probabilities/continuous score for Heavy Delay (using the raw predicted seconds as a proxy score)
    # The higher the predicted seconds, the more likely it is a Heavy Delay
    
    fpr, tpr, _ = roc_curve(y_test_binary, y_pred)
    roc_auc = auc(fpr, tpr)
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ETA Model: ROC Curve (Predicting Heavy Delay)')
    plt.legend(loc="lower right")
    plt.savefig(os.path.join(GRAPHS_DIR, 'eta_roc_curve.png'))
    plt.close()

    # 5. F1 Scores
    report = classification_report(y_test_class, y_pred_class, target_names=['On Time', 'Slight Delay', 'Heavy Delay'], output_dict=True)
    f1_scores = [report['On Time']['f1-score'], report['Slight Delay']['f1-score'], report['Heavy Delay']['f1-score']]
    
    plt.figure(figsize=(8, 5))
    plt.bar(['On Time', 'Slight Delay', 'Heavy Delay'], f1_scores, color=['green', 'orange', 'red'])
    plt.ylim(0, 1.1)
    plt.title('ETA Model: F1 Score Comparison by Class')
    plt.ylabel('F1 Score')
    plt.savefig(os.path.join(GRAPHS_DIR, 'eta_f1_scores.png'))
    plt.close()

if __name__ == "__main__":
    ensure_graphs_dir()
    evaluate_crowd_model()
    evaluate_eta_model()
    print("All evaluation visualizations have been generated in the /graphs directory.")
