import json
import pandas as pd
import numpy as np
from datetime import datetime
import os

DB_EXPORT_PATH = '../smartbus-23f62-default-rtdb-export.json'
OUTPUT_DIR = 'data'

def ensure_output_dir():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

def load_data():
    with open(DB_EXPORT_PATH, 'r') as f:
        return json.load(f)

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance in kilometers between two points on the earth."""
    # Radius of earth in kilometers.
    r = 6371
    
    # Convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a)) 
    
    return c * r * 1000 # returns distance in meters

def process_crowd_data(data):
    """
    Extracts passenger 'history' data to train a Crowd Forecasting model.
    Expected output columns: ['timestamp', 'hour', 'day_of_week', 'occupancy_count', 'occupancy_percent']
    """
    print("Processing Crowd Data...")
    bus_data = data.get('Bus_01', {})
    history = bus_data.get('history', {})
    
    records = []
    # Assume a standard bus capacity for this dataset
    BUS_CAPACITY = 50 
    
    for key, val in history.items():
        try:
            ts_str = val.get('timestamp')
            count = val.get('count', 0)
            
            # Parse timestamp (e.g., "2026-03-01 09:05:10")
            dt = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
            
            records.append({
                'timestamp': dt,
                'hour': dt.hour,
                'minute': dt.minute,
                'day_of_week': dt.weekday(), # 0=Monday, 6=Sunday
                'is_weekend': 1 if dt.weekday() >= 5 else 0,
                'occupancy_count': count,
                'occupancy_percent': min(100, (count / BUS_CAPACITY) * 100)
            })
        except Exception as e:
            print(f"Skipping record {key} due to error: {e}")
            
    df = pd.DataFrame(records)
    if not df.empty:
        df = df.sort_values('timestamp')
        output_file = os.path.join(OUTPUT_DIR, 'crowd_training_data.csv')
        df.to_csv(output_file, index=False)
        print(f"Saved {len(df)} crowd records to {output_file}")
    else:
        print("Warning: No crowd history data found.")
    
    return df

def process_eta_data(data):
    """
    Extracts 'location_history' to train an ETA (Predictive Delay) model.
    Expected output columns: ['timestamp', 'lat', 'lng', 'speed', 'hour', 'day_of_week', 'distance_to_next']
    """
    print("Processing ETA Data...")
    bus_data = data.get('Bus_01', {})
    loc_history = bus_data.get('location_history', {})
    
    records = []
    
    for key, val in loc_history.items():
        try:
            ts_str = val.get('timestamp')
            lat = val.get('lat')
            lng = val.get('lng')
            speed = val.get('speed', 0.0)
            
            dt = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
            
            records.append({
                'id': key,
                'timestamp': dt,
                'lat': lat,
                'lng': lng,
                'speed': speed,
                'hour': dt.hour,
                'day_of_week': dt.weekday(),
                'is_weekend': 1 if dt.weekday() >= 5 else 0,
            })
        except Exception as e:
            print(f"Skipping loc record {key} due to error: {e}")
            
    df = pd.DataFrame(records)
    if df.empty:
        print("Warning: No location history data found.")
        return df
        
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    # ---------------- Feature Engineering ----------------
    # To predict ETA, we need to show the model how long it took to travel X distance in Y context.
    # We will compute the 'delay' to the next 5 pings as a training target.
    
    print("Engineering ETA Features...")
    # Calculate distance and time to a future point (e.g., 5 steps ahead to represent 'next stop')
    STEPS_AHEAD = 5
    
    # Shift to get future coordinates and timestamps
    df['future_lat'] = df['lat'].shift(-STEPS_AHEAD)
    df['future_lng'] = df['lng'].shift(-STEPS_AHEAD)
    df['future_timestamp'] = df['timestamp'].shift(-STEPS_AHEAD)
    
    # Drop rows at the end that don't have a future point
    df = df.dropna(subset=['future_lat'])
    
    # Calculate target variables
    # 1. Actual Time Taken (seconds)
    df['actual_time_seconds'] = (df['future_timestamp'] - df['timestamp']).dt.total_seconds()
    
    # 2. Distance to cover (meters)
    # Using vectorized haversine calculation
    distances = []
    for i, row in df.iterrows():
        dist = haversine_distance(row['lat'], row['lng'], row['future_lat'], row['future_lng'])
        distances.append(dist)
    df['distance_meters'] = distances
    
    # 3. Theoretical Time (Physics formula)
    # Assuming standard max speed limit if current speed is 0
    # Speeds are likely in km/h. Convert to m/s: x * (1000/3600)
    avg_trip_speed_ms = 30 * (1000/3600) # 30 km/h average
    
    # Avoid division by zero by using max(speed, minimal_speed)
    safe_speed_ms = np.maximum(df['speed'] * (1000/3600), 5.0 * (1000/3600)) # At least 5km/h
    
    df['theoretical_time_seconds'] = df['distance_meters'] / safe_speed_ms
    
    # 4. Target Residual (Delay)
    # The XGBoost model will try to predict THIS value based on location/time
    # Actual = Theoretical + Delay  =>  Delay = Actual - Theoretical
    df['delay_seconds'] = df['actual_time_seconds'] - df['theoretical_time_seconds']
    
    output_file = os.path.join(OUTPUT_DIR, 'eta_training_data.csv')
    df.to_csv(output_file, index=False)
    print(f"Saved {len(df)} ETA training records to {output_file}")
    
    return df

if __name__ == "__main__":
    ensure_output_dir()
    db_data = load_data()
    process_crowd_data(db_data)
    process_eta_data(db_data)
    print("Data processing complete.")
