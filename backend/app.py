import time
import re
import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ==========================================
# 1. LOAD ML MODELS
# ==========================================
print("Loading Models...")
try:
    nlp_model = joblib.load('models/nlp_intent_model.pkl')
    crowd_model = joblib.load('models/crowd_model.pkl')
    eta_model = joblib.load('models/eta_xgboost_model.pkl')
    eta_features = joblib.load('models/eta_features.pkl')
    print("All models loaded successfully!")
except Exception as e:
    print(f"Error loading models: {e}. Did you run the training scripts?")

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================
def get_crowd_prediction(hour, minute, day_of_week, is_weekend):
    # Predict from model
    X = pd.DataFrame([{
        'hour': hour,
        'minute': minute,
        'day_of_week': day_of_week,
        'is_weekend': is_weekend
    }])
    pred = crowd_model.predict(X)[0]
    return max(0, min(100, pred))

def get_eta_prediction(lat, lng, speed, hour, day_of_week, is_weekend, distance, theoretical_time):
    X = pd.DataFrame([{
        'lat': lat,
        'lng': lng,
        'speed': speed,
        'hour': hour,
        'day_of_week': day_of_week,
        'is_weekend': is_weekend,
        'distance_meters': distance,
        'theoretical_time_seconds': theoretical_time
    }])
    
    # Ensure correct feature order for XGBoost
    X = X[eta_features]
    delay_sec = eta_model.predict(X)[0]
    
    # Actual ETA = Theoretical + Delay
    actual_eta = theoretical_time + delay_sec
    return max(0, actual_eta)

# ==========================================
# 3. ENDPOINTS
# ==========================================

@app.route('/api/predict/crowd', methods=['POST'])
def predict_crowd():
    data = request.json
    try:
        hour = data.get('hour', datetime.now().hour)
        minute = data.get('minute', datetime.now().minute)
        day = data.get('day_of_week', datetime.now().weekday())
        weekend = 1 if day >= 5 else 0
        
        pred = get_crowd_prediction(hour, minute, day, weekend)
        
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
        # Expected inputs for a real system, defaulting for demo purposes
        lat = data.get('lat', 6.9271)
        lng = data.get('lng', 79.8612)
        speed = data.get('speed', 15.0)
        hour = data.get('hour', datetime.now().hour)
        day = data.get('day_of_week', datetime.now().weekday())
        weekend = 1 if day >= 5 else 0
        distance = data.get('distance_meters', 2500)
        theoretical = data.get('theoretical_time_seconds', 300)

        pred_seconds = get_eta_prediction(lat, lng, speed, hour, day, weekend, distance, theoretical)
        
        return jsonify({
            'success': True,
            'prediction_seconds': float(pred_seconds),
            'delay_seconds': float(pred_seconds - theoretical)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
        
    # 1. Classify Intent
    intent = nlp_model.predict([text])[0]
    confidence = max(nlp_model.predict_proba([text])[0])
    
    print(f"User: '{text}' -> Intent: {intent} (Conf: {confidence:.2f})")
    
    # 2. Extract Route Number
    route_match = re.search(r'\b(\d+(?:/\d+)?)\b', text)
    requested_route = route_match.group(1) if route_match else None
    
    # 3. Route to appropriate ML model and construct Rich UI response
    response_msg = {
        'id': str(time.time()),
        'sender': 'bot',
        'timestamp': datetime.now().isoformat()
    }
    
    # Enforce dataset limitation constraint for ML predictions
    if requested_route and requested_route != '400/4' and intent in ['predict_crowd', 'predict_eta']:
        response_msg['type'] = 'text'
        response_msg['text'] = f"I'm sorry, my Machine Learning models are currently only trained on telemetry data for route 400/4. I cannot provide predictive insights for route {requested_route} yet."
        return jsonify({'success': True, 'message': response_msg})
        
    now = datetime.now()
    
    if intent == 'predict_crowd':
        # Default to next hour for demo
        pred = get_crowd_prediction(now.hour + 1, now.minute, now.weekday(), 1 if now.weekday() >= 5 else 0)
        
        response_msg['type'] = 'crowd_forecast'
        response_msg['text'] = f"Based on our Random Forest model, here is the crowd forecast using IoT truth data:"
        response_msg['data'] = {
            'route': requested_route or '400/4',
            'context': 'Next Hour',
            'currentOccupancy': round(pred),
            'trend': 'Stable',
            'recommendation': 'Try avoiding peak times.' if pred > 60 else 'Good time to travel.',
            'forecast': [
                {'time': 'Now', 'level': round(get_crowd_prediction(now.hour, now.minute, now.weekday(), 1 if now.weekday() >= 5 else 0))},
                {'time': '+1hr', 'level': round(pred)},
                {'time': '+2hr', 'level': round(get_crowd_prediction(now.hour + 2, now.minute, now.weekday(), 1 if now.weekday() >= 5 else 0))},
            ]
        }
        
    elif intent == 'predict_eta':
        theoretical = 450 # 7.5 mins
        pred_sec = get_eta_prediction(6.9, 79.8, 10.0, now.hour, now.weekday(), 1 if now.weekday()>=5 else 0, 3000, theoretical)
        
        response_msg['type'] = 'ai_prediction'
        response_msg['text'] = "Using our XGBoost engine trained on bus telemetry, I've calculated the predictive ETA."
        response_msg['data'] = {
            'route': requested_route or '400/4',
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
            'busRoute': requested_route or '400/4',
            'crowdLevel': 'Medium',
            'seatsAvailable': True,
            'locationName': 'Malabe Bus Stand',
            'coordinates': {
                'latitude': 6.9061,
                'longitude': 79.9647,
            },
        }
        
    else: # Greeting
        response_msg['type'] = 'text'
        response_msg['text'] = "Hello! I am your AI assistant. I can predict bus ETAs and Crowd levels using Machine Learning. Try asking 'When is the next 400/4 bus?' or 'Will it be crowded?'"
        
    return jsonify({'success': True, 'message': response_msg})

if __name__ == '__main__':
    print("Starting ML API Server on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=True)
