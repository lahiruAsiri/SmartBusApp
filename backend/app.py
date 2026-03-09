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
        
        is_trained = crowd_features and f'route_{route}' in crowd_features
        pred = get_crowd_prediction(route, hour, minute, day, weekend)
        
        print(f"--- Crowd Prediction Request ---")
        print(f"Route: {route} | Trained: {is_trained}")
        print(f"Result: {pred:.2f}%")
        
        return jsonify({
            'success': True,
            'prediction': pred,
            'is_trained': is_trained,
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

        is_trained = eta_features and f'route_{route}' in eta_features
        pred_seconds = get_eta_prediction(route, lat, lng, speed, hour, day, weekend, distance, theoretical)
        
        print(f"--- ETA Prediction Request ---")
        print(f"Route: {route} | Trained: {is_trained}")
        print(f"Result: {pred_seconds:.2f}s")
        
        return jsonify({
            'success': True,
            'is_trained': is_trained,
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
    test_text = text.lower()
    
    try:
        # 1. Determine the base date (Today, Tomorrow, etc.)
        days_offset = 0
        if 'tomorrow' in test_text:
            days_offset = 1
        elif 'day after tomorrow' in test_text:
            days_offset = 2
        elif 'next week' in test_text:
            days_offset = 7
            
        base_date = now + timedelta(days=days_offset)
        
        # 2. Parse the time from text
        # We use a dummy default to see if dateparser actually found a date or just time
        parsed_dt = date_parser.parse(text, default=base_date, fuzzy=True)
        
        # 3. If no specific date was found in text (like "March 15th"), 
        # ensure we use our calculated offset date but keep the parsed time
        # Check if dateparser changed the year/month/day from the default
        if (parsed_dt.year == base_date.year and 
            parsed_dt.month == base_date.month and 
            parsed_dt.day == base_date.day):
            # No date override found in text, our offset is safe
            pass
        elif days_offset > 0:
            # If we had a "tomorrow" keyword but dateparser found something else,
            # we force the offset date unless it specifically found a different date
            # Actually, most cases "tomorrow 9am" dateparser might return today 9am 
            # if it doesn't support the keyword "tomorrow" internally.
            # So we re-apply the base date components.
            parsed_dt = parsed_dt.replace(year=base_date.year, month=base_date.month, day=base_date.day)

        # 4. Handle "past time" logic: if I ask "9am" at 10am, I usually mean tomorrow
        if parsed_dt < now and days_offset == 0:
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
    
    # NEW: Temporal Parsing (Strip route number first to avoid year-parsing bugs)
    text_for_time = re.sub(r'\b' + re.escape(requested_route) + r'\b', '', text)
    target_time, is_custom_time = extract_time(text_for_time)
    
    print(f"\n--- AI Chat Prediction Log ---")
    print(f"Input Text: '{text}'")
    print(f"Extracted Intent: {intent} ({confidence:.2f})")
    print(f"Detected Route: {requested_route}")
    print(f"Target Timestamp: {target_time.strftime('%Y-%m-%d %H:%M:%S')} (Custom: {is_custom_time})")
    
    response_msg = {
        'id': str(time.time()),
        'sender': 'bot',
        'timestamp': datetime.now().isoformat()
    }
    
    # Check if we have features for this route, if not, reject
    if crowd_features and f'route_{requested_route}' not in crowd_features and intent in ['predict_crowd', 'predict_eta']:
        response_msg['type'] = 'text'
        response_msg['text'] = f"AI insights for route {requested_route} are currently being processed. Full predictive details for this route will be updated and available soon!"
        print(f"Result: Friendly Redirect (No data for route)")
        return jsonify({'success': True, 'message': response_msg})
        
    if intent == 'predict_crowd':
        is_weekend = 1 if target_time.weekday() >= 5 else 0
        pred = get_crowd_prediction(requested_route, target_time.hour, target_time.minute, target_time.weekday(), is_weekend)
        
        print(f"Crowd Pred Params: Hour={target_time.hour}, Day={target_time.weekday()}, Weekend={is_weekend}")
        print(f"Raw Prediction: {pred:.2f}%")
        
        response_msg['type'] = 'crowd_forecast'
        response_msg['text'] = f"Here is the predicted passenger density for route {requested_route} on {target_time.strftime('%A')} at {target_time.strftime('%I:%M %p')}:"
        response_msg['data'] = {
            'route': requested_route,
            'context': target_time.strftime('%a %H:%M'),
            'currentOccupancy': round(pred),
            'trend': 'Stable',
            'recommendation': 'Try avoiding peak times.' if pred > 60 else 'Good time to travel.',
            'forecast': [
                {'time': '-1hr', 'level': round(get_crowd_prediction(requested_route, (target_time.hour - 1)%24, target_time.minute, target_time.weekday(), is_weekend))},
                {'time': 'Target', 'level': round(pred)},
                {'time': '+1hr', 'level': round(get_crowd_prediction(requested_route, (target_time.hour + 1)%24, target_time.minute, target_time.weekday(), is_weekend))},
            ]
        }
        
    elif intent == 'predict_eta':
        theoretical = 450
        is_weekend = 1 if target_time.weekday() >= 5 else 0
        pred_sec = get_eta_prediction(requested_route, 6.9, 79.8, 10.0, target_time.hour, target_time.weekday(), is_weekend, 3000, theoretical)
        
        print(f"ETA Pred Params: Hour={target_time.hour}, Day={target_time.weekday()}, Weekend={is_weekend}")
        print(f"Raw Prediction: {pred_sec:.2f} seconds")
        
        response_msg['type'] = 'ai_prediction'
        response_msg['text'] = f"I've calculated the optimal arrival time for route {requested_route} at {target_time.strftime('%I:%M %p')} tomorrow." if target_time.day != datetime.now().day else f"I've calculated the optimal arrival time for route {requested_route} for right now."
        response_msg['data'] = {
            'route': requested_route,
            'standardEta': f"{int(theoretical//60)} mins",
            'aiEta': f"{int(pred_sec//60)} mins",
            'confidence': f"{min(98, max(85, int(confidence * 100)))}%",
            'reason': "Higher traffic expected" if pred_sec > theoretical * 1.2 else "Smooth traffic predicted"
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
