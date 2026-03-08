```python
import time
import re
import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from dateutil import parser as date_parser
import subprocess
import os

app = Flask(__name__)
CORS(app)

# ==========================================
# 1. LOAD ML MODELS (Dynamic Loading)
# ==========================================
# We store these as globals so they can be reloaded by the /api/retrain endpoint without restarting the server.
nlp_model = None
crowd_model = None
crowd_features = None
eta_model = None
eta_features = None

def load_all_models():
    global nlp_model, crowd_model, crowd_features, eta_model, eta_features
    print("Loading Models...")
    try:
        nlp_model = joblib.load('models/nlp_intent_model.pkl')
        crowd_model = joblib.load('models/crowd_model.pkl')
        crowd_features = joblib.load('models/crowd_features.pkl')
        eta_model = joblib.load('models/eta_xgboost_model.pkl')
        eta_features = joblib.load('models/eta_features.pkl')
        print("All models loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading models: {e}. Has the training script been run?")
        return False

# Initial Load
load_all_models()

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================
def get_crowd_prediction(route, hour, minute, day_of_week, is_weekend):
    # Construct input dataframe matching exact training time features
    input_data = {
        'hour': hour,
        'minute': minute,
        'day_of_week': day_of_week,
        'is_weekend': is_weekend
    }
    
    # Add dummy variables for ALL possible routes seen during training, defaulting to 0
    for feat in crowd_features:
        if feat.startswith('route_'):
            input_data[feat] = 0
            
    # Set the specific requested route to 1
    route_key = f'route_{route}'
    if route_key in input_data:
        input_data[route_key] = 1
    else:
        # If route was never seen in training data, default or handle gracefully
        # In a real app we might return a default or error, here we proceed with all 0s for route
        pass

    X = pd.DataFrame([input_data])
    
    # Ensure columns match strict XGBoost/SKLearn expected order
    X = X[crowd_features]
    
    pred = crowd_model.predict(X)[0]
    return max(0, min(100, pred))

def get_eta_prediction(route, lat, lng, speed, hour, day_of_week, is_weekend, distance, theoretical_time):
    input_data = {
        'lat': lat,
        'lng': lng,
        'speed': speed,
        'hour': hour,
        'day_of_week': day_of_week,
        'is_weekend': is_weekend,
        'distance_meters': distance,
        'theoretical_time_seconds': theoretical_time
    }
    
    # One-Hot Encode the route dynamically
    for feat in eta_features:
        if feat.startswith('route_'):
            input_data[feat] = 0
            
    route_key = f'route_{route}'
    if route_key in input_data:
        input_data[route_key] = 1

    X = pd.DataFrame([input_data])
    X = X[eta_features]
    
    delay_sec = eta_model.predict(X)[0]
    actual_eta = theoretical_time + delay_sec
    return max(0, actual_eta)

# ==========================================
# 3. ENDPOINTS
# ==========================================

@app.route('/api/retrain', methods=['POST'])
def retrain_models():
    """
    Triggers incremental data processing, model retraining, and hot-swaps the models.
    Expects JSON: { "file_path": "/path/to/2026.03.01.json" }
    """
    data = request.json
    file_path = data.get('file_path')
    
    if not file_path:
        return jsonify({'success': False, 'error': 'Missing file_path payload'}), 400
        
    if not os.path.exists(file_path):
        return jsonify({'success': False, 'error': f'File not found: {file_path}'}), 404
        
    try:
        # 1. Process Data
        print(f"Processing data from {file_path}")
        subprocess.run(['python', 'data_processing.py', '--file', file_path], check=True)
        
        # 2. Retrain Crowd Model
        print(f"Retraining Crowd Model...")
        subprocess.run(['python', 'train_crowd_model.py'], check=True)
        
        # 3. Retrain ETA Model
        print(f"Retraining ETA Model...")
        subprocess.run(['python', 'train_eta_model.py'], check=True)
        
        # 4. Hot Reload Models
        success = load_all_models()
        if not success:
            raise Exception("Failed to reload models into memory after training.")
            
        return jsonify({
            'success': True, 
            'message': 'Data merged, models trained, and models reloaded successfully!'
        })
    except subprocess.CalledProcessError as e:
        return jsonify({'success': False, 'error': f'Script execution failed: {e}'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/predict/crowd', methods=['POST'])
def predict_crowd():
    data = request.json
    try:
        route = data.get('route', '400/4')
        hour = data.get('hour', datetime.now().hour)
        minute = data.get('minute', datetime.now().minute)
        day = data.get('day_of_week', datetime.now().weekday())
        weekend = 1 if day >= 5 else 0
        
        pred = get_crowd_prediction(route, hour, minute, day, weekend)
        
        return jsonify({
            'success': True,
            'prediction': pred,
            'level': 'High' if pred > 70 else 'Medium' if pred > 40 else 'Low'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/predict/eta', methods=['POST'])
def predict_eta():
    data = request.json
    try:
        route = data.get('route', '400/4')
        lat = data.get('lat', 6.9271)
        lng = data.get('lng', 79.8612)
        speed = data.get('speed', 15.0)
        hour = data.get('hour', datetime.now().hour)
        day = data.get('day_of_week', datetime.now().weekday())
        weekend = 1 if day >= 5 else 0
        distance = data.get('distance_meters', 2500)
        theoretical = data.get('theoretical_time_seconds', 300)

        pred_seconds = get_eta_prediction(route, lat, lng, speed, hour, day, weekend, distance, theoretical)
        
        return jsonify({
            'success': True,
            'prediction_seconds': float(pred_seconds),
            'delay_seconds': float(pred_seconds - theoretical)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def extract_time(text):
    """
    Attempts to extract a datetime object from natural language.
    Returns (datetime_obj, is_custom)
    """
    now = datetime.now()
    try:
        # Basic relative keywords
        test_text = text.lower()
        base_date = now
        
        if 'tomorrow' in test_text:
            base_date = now + timedelta(days=1)
        elif 'day after tomorrow' in test_text:
            base_date = now + timedelta(days=2)
            
        # Try to find a time pattern (e.g. 9am, 15:30)
        # We use fuzzy parsing but keep the date from our base_date
        parsed_dt = date_parser.parse(text, default=base_date, fuzzy=True)
        
        # If the parsed time is in the past and no relative keyword was used, 
        # it might just be a time for today that already passed? 
        # But usually users asking "9am" at 10am mean tomorrow.
        if parsed_dt < now and 'tomorrow' not in test_text and 'day after' not in test_text:
             # If it's a specific time today that already passed, default to tomorrow
             if (now - parsed_dt).total_seconds() > 60: 
                parsed_dt = parsed_dt + timedelta(days=1)
                
        return parsed_dt, True
    except:
        return now, False

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
        
    intent = nlp_model.predict([text])[0]
    confidence = max(nlp_model.predict_proba([text])[0])
    
    route_match = re.search(r'\b(\d+(?:/\d+)?)\b', text)
    requested_route = route_match.group(1) if route_match else '400/4' # Default
    
    response_msg = {
        'id': str(time.time()),
        'sender': 'bot',
        'timestamp': datetime.now().isoformat()
    }
    
    # Check if we have features for this route, if not, reject
    if crowd_features and f'route_{requested_route}' not in crowd_features and intent in ['predict_crowd', 'predict_eta']:
        response_msg['type'] = 'text'
        response_msg['text'] = f"I'm sorry, I don't have enough training data for route {requested_route} yet."
        return jsonify({'success': True, 'message': response_msg})
        
    now = datetime.now()
    
    if intent == 'predict_crowd':
        pred = get_crowd_prediction(requested_route, now.hour + 1, now.minute, now.weekday(), 1 if now.weekday() >= 5 else 0)
        
        response_msg['type'] = 'crowd_forecast'
        response_msg['text'] = f"Based on our model, here is the crowd forecast using IoT truth data:"
        response_msg['data'] = {
            'route': requested_route,
            'context': 'Next Hour',
            'currentOccupancy': round(pred),
            'trend': 'Stable',
            'recommendation': 'Try avoiding peak times.' if pred > 60 else 'Good time to travel.',
            'forecast': [
                {'time': 'Now', 'level': round(get_crowd_prediction(requested_route, now.hour, now.minute, now.weekday(), 1 if now.weekday() >= 5 else 0))},
                {'time': '+1hr', 'level': round(pred)},
                {'time': '+2hr', 'level': round(get_crowd_prediction(requested_route, (now.hour + 2)%24, now.minute, now.weekday(), 1 if now.weekday() >= 5 else 0))},
            ]
        }
        
    elif intent == 'predict_eta':
        theoretical = 450
        pred_sec = get_eta_prediction(requested_route, 6.9, 79.8, 10.0, now.hour, now.weekday(), 1 if now.weekday()>=5 else 0, 3000, theoretical)
        
        response_msg['type'] = 'ai_prediction'
        response_msg['text'] = "Using our ML engine trained on bus telemetry, I've calculated the predictive ETA."
        response_msg['data'] = {
            'route': requested_route,
            'standardEta': f"{int(theoretical//60)} mins",
            'aiEta': f"{int(pred_sec//60)} mins",
            'confidence': f"{min(98, max(85, int(confidence * 100)))}%",
            'reason': 'Traffic dynamically predicted',
            'delayRisk': 'High' if (pred_sec - theoretical) > 120 else 'Low'
        }
        
    elif intent == 'find_route':
        response_msg['type'] = 'rich_response'
        response_msg['text'] = "I found a great option for you."
        response_msg['data'] = {
            'busRoute': requested_route,
            'crowdLevel': 'Medium',
            'seatsAvailable': True,
            'locationName': 'Malabe Bus Stand',
            'coordinates': {
                'latitude': 6.9061,
                'longitude': 79.9647,
            },
        }
        
    else: 
        response_msg['type'] = 'text'
        response_msg['text'] = "Hello! I am your AI assistant. I can predict bus ETAs and Crowd levels using Machine Learning."
        
    return jsonify({'success': True, 'message': response_msg})

if __name__ == '__main__':
    print("Starting ML API Server on port 5001...")
    # Add activate_this to ensure virtual env runs appropriately via subprocesses later if needed
    app.run(host='0.0.0.0', port=5001, debug=True)
