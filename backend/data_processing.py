import json
import pandas as pd
import numpy as np
from datetime import datetime
import os
import argparse

OUTPUT_DIR = 'data'

def ensure_output_dir():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance in kilometers between two points on the earth."""
    r = 6371
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a)) 
    return c * r * 1000 # meters

def process_crowd_data(file_path):
    print(f"Processing Crowd Data from {file_path}...")
    with open(file_path, 'r') as f:
        data = json.load(f)
        
    records = []
    BUS_CAPACITY = 50 
    
    for item in data:
        try:
            ts_str = item.get('timestamp')
            count = item.get('crowd', 0)
            route = item.get('route', 'Unknown')
            
            # The new format timestamp looks like "2026-03-01T09:04:53+05:30"
            # We'll parse it ignoring the timezone for simplicity in modeling, or handle it carefully.
            # Easiest is to use fromisoformat
            dt = datetime.fromisoformat(ts_str)
            
            records.append({
                'timestamp': dt.replace(tzinfo=None), # Remove tz for easier pandas handling
                'route': route,
                'hour': dt.hour,
                'minute': dt.minute,
                'day_of_week': dt.weekday(),
                'is_weekend': 1 if dt.weekday() >= 5 else 0,
                'occupancy_count': count,
                'occupancy_percent': min(100, (count / BUS_CAPACITY) * 100)
            })
        except Exception as e:
            print(f"Skipping record due to error: {e}")
            
    df_new = pd.DataFrame(records)
    if not df_new.empty:
        output_file = os.path.join(OUTPUT_DIR, 'crowd_training_data.csv')
        
        # Incremental Merge Logic
        if os.path.exists(output_file):
            df_existing = pd.read_csv(output_file, parse_dates=['timestamp'])
            df_combined = pd.concat([df_existing, df_new], ignore_index=True)
            # Drop exact duplicates just in case the same file is processed twice
            df_combined = df_combined.drop_duplicates(subset=['timestamp', 'route'])
            df_combined = df_combined.sort_values(['route', 'timestamp'])
        else:
            df_combined = df_new.sort_values(['route', 'timestamp'])
            
        df_combined.to_csv(output_file, index=False)
        print(f"Saved/Merged. Total dataset now has {len(df_combined)} crowd records in {output_file}")
        return df_combined
    else:
        print("Warning: No crowd data found in file.")
        return pd.DataFrame()

def process_eta_data(file_path):
    print(f"Processing ETA Data from {file_path}...")
    with open(file_path, 'r') as f:
        data = json.load(f)
        
    records = []
    
    for item in data:
        try:
            ts_str = item.get('timestamp')
            route = item.get('route', 'Unknown')
            loc = item.get('location', {})
            lat = loc.get('lat')
            lng = loc.get('lng')
            speed = item.get('speed', 0.0)
            
            dt = datetime.fromisoformat(ts_str)
            
            if lat is not None and lng is not None:
                records.append({
                    'timestamp': dt.replace(tzinfo=None),
                    'route': route,
                    'lat': lat,
                    'lng': lng,
                    'speed': speed,
                    'hour': dt.hour,
                    'day_of_week': dt.weekday(),
                    'is_weekend': 1 if dt.weekday() >= 5 else 0,
                })
        except Exception as e:
            pass # Skip bad records quietly
            
    df_new = pd.DataFrame(records)
    if df_new.empty:
        print("Warning: No location data found in file.")
        return pd.DataFrame()
        
    # We must sort and group by route before calculating distance/time
    df_new = df_new.sort_values(['route', 'timestamp']).reset_index(drop=True)
    
    print("Engineering ETA Features...")
    STEPS_AHEAD = 5
    
    # Calculate future points *per route* to avoid predicting ETA from Route A to Route B's location
    df_new['future_lat'] = df_new.groupby('route')['lat'].shift(-STEPS_AHEAD)
    df_new['future_lng'] = df_new.groupby('route')['lng'].shift(-STEPS_AHEAD)
    df_new['future_timestamp'] = df_new.groupby('route')['timestamp'].shift(-STEPS_AHEAD)
    
    df_new = df_new.dropna(subset=['future_lat'])
    
    df_new['actual_time_seconds'] = (df_new['future_timestamp'] - df_new['timestamp']).dt.total_seconds()
    
    distances = []
    for i, row in df_new.iterrows():
        dist = haversine_distance(row['lat'], row['lng'], row['future_lat'], row['future_lng'])
        distances.append(dist)
    df_new['distance_meters'] = distances
    
    avg_trip_speed_ms = 30 * (1000/3600)
    safe_speed_ms = np.maximum(df_new['speed'] * (1000/3600), 5.0 * (1000/3600)) 
    
    df_new['theoretical_time_seconds'] = df_new['distance_meters'] / safe_speed_ms
    df_new['delay_seconds'] = df_new['actual_time_seconds'] - df_new['theoretical_time_seconds']
    
    # We only need specific columns for training
    features_to_save = [
        'timestamp', 'route', 'lat', 'lng', 'speed', 
        'hour', 'day_of_week', 'is_weekend',
        'distance_meters', 'theoretical_time_seconds', 'delay_seconds'
    ]
    df_new = df_new[features_to_save]
    
    output_file = os.path.join(OUTPUT_DIR, 'eta_training_data.csv')
    
    if os.path.exists(output_file):
        df_existing = pd.read_csv(output_file, parse_dates=['timestamp'])
        df_combined = pd.concat([df_existing, df_new], ignore_index=True)
        # Drop duplicates based on timestamp and route
        df_combined = df_combined.drop_duplicates(subset=['timestamp', 'route'])
        df_combined = df_combined.sort_values(['route', 'timestamp'])
    else:
        df_combined = df_new.sort_values(['route', 'timestamp'])
        
    df_combined.to_csv(output_file, index=False)
    print(f"Saved/Merged. Total dataset now has {len(df_combined)} ETA records in {output_file}")
    
    return df_combined

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process daily bus JSON files into training CSV datasets (Incremental Append)")
    parser.add_argument('--file', type=str, required=True, help='Path to the JSON file to process')
    args = parser.parse_args()
    
    ensure_output_dir()
    print(f"Starting incremental processing for: {args.file}")
    process_crowd_data(args.file)
    process_eta_data(args.file)
    print("Data processing complete.")

