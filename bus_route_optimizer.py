import json
import math
import time
import sys

# Check if running in Google Colab
try:
    import google.colab
    IN_COLAB = True
except ImportError:
    IN_COLAB = False

class BusRouteOptimizer:
    def __init__(self, json_data):
        # The JSON is nested (districts -> sections -> subsections -> routes)
        # We need to extract the flat list of routes first.
        self.routes = self._extract_routes(json_data)
        self.location_index = {}
        self.route_data = []
        self._build_index()

    def _extract_routes(self, data):
        """Recursively extracts all items from lists key'd 'routes'."""
        collected_routes = []
        
        if isinstance(data, dict):
            for key, value in data.items():
                if key == 'routes' and isinstance(value, list):
                    collected_routes.extend(value)
                else:
                    collected_routes.extend(self._extract_routes(value))
        elif isinstance(data, list):
            for item in data:
                collected_routes.extend(self._extract_routes(item))
                
        return collected_routes

    def _build_index(self):
        """Pre-processes the JSON into efficient lookups."""
        print("Building indices...")
        start_time = time.time()
        
        for r_idx, route in enumerate(self.routes):
            # Extract basic info
            route_num = route.get('route_number', 'Unknown')
            
            # Simplified stops: (lat, lon, name, original_obj)
            stops = []
            if 'bus_stops' in route:
                for stop in route['bus_stops']:
                    lat = stop.get('latitude')
                    lon = stop.get('longitude')
                    name = stop.get('location_name', '').lower()
                    if lat is not None and lon is not None:
                        stops.append({
                            'lat': lat,
                            'lon': lon,
                            'name': name,
                            'full_stop': stop
                        })
            
            self.route_data.append({
                'route_number': route_num,
                'stops': stops,
                'original': route
            })

            # Indexing intermediate locations AND bus stop names
            # We normalize to lowercase for case-insensitive search
            keywords = set()
            
            # Add intermediate locations
            if 'intermediate_locations' in route:
                for loc in route['intermediate_locations']:
                    keywords.add(loc.lower())
            
            # Add bus stop names
            for stop in stops:
                keywords.add(stop['name'])
            
            for kw in keywords:
                if kw not in self.location_index:
                    self.location_index[kw] = []
                self.location_index[kw].append(r_idx)
                
        end_time = time.time()
        print(f"Indexing complete in {(end_time - start_time)*1000:.2f} ms")
        print(f"Indexed {len(self.location_index)} unique locations.")

    def haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculates distance in meters between two points."""
        R = 6371000  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)

        a = math.sin(dphi / 2)**2 + \
            math.cos(phi1) * math.cos(phi2) * \
            math.sin(dlambda / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R * c

    def find_best_route(self, user_lat, user_lon, destination_name):
        """
        Finds the best routes to a destination and the closest stop on those routes.
        Returns a sorted list of matches.
        """
        dest_key = destination_name.lower()
        
        # 1. Filter routes that go to the destination
        candidate_indices = self.location_index.get(dest_key, [])
        
        if not candidate_indices:
            return []

        results = []
        
        # 2. For each candidate route, find the closest stop to the user
        for r_idx in candidate_indices:
            route = self.route_data[r_idx]
            stops = route['stops']
            
            if not stops:
                continue
                
            # Find closest stop in this route
            min_dist = float('inf')
            closest_stop = None
            
            for stop in stops:
                dist = self.haversine_distance(user_lat, user_lon, stop['lat'], stop['lon'])
                if dist < min_dist:
                    min_dist = dist
                    closest_stop = stop
            
            if closest_stop:
                results.append({
                    'route_number': route['route_number'],
                    'closest_stop': closest_stop['full_stop'],
                    'distance_meters': min_dist,
                    'destination_match': destination_name
                })
        
        # Sort by distance (closest stop first)
        results.sort(key=lambda x: x['distance_meters'])
        return results

    def find_transfer_route(self, user_lat, user_lon, destination_name):
        """
        Finds a route to the destination. If the pickup point is too far (>1000m),
        looks for a feeder bus to get to that pickup point.
        """
        # 1. Best direct route
        direct_matches = self.find_best_route(user_lat, user_lon, destination_name)
        
        if not direct_matches:
            return None

        best_direct = direct_matches[0]
        dist_to_main_stop = best_direct['distance_meters']
        
        # If close enough, return just this (<= 1000m)
        if dist_to_main_stop <= 1000:
            return {
                "type": "direct",
                "route_1": best_direct
            }
            
        # 2. Too far - try to find a feeder
        # The stop we need to get to is best_direct['closest_stop']
        # We will treat this stop's name as the destination for the feeder bus
        transfer_location = best_direct['closest_stop']['location_name']
        
        # Search for route from User -> Transfer Location
        feeder_matches = self.find_best_route(user_lat, user_lon, transfer_location)
        
        if feeder_matches:
            best_feeder = feeder_matches[0]
            # Verify feeder is actually useful (closer to user than the direct walk)
            # and within reasonable walking distance
            if best_feeder['distance_meters'] < dist_to_main_stop and best_feeder['distance_meters'] < 1000:
                return {
                    "type": "transfer",
                    "route_1": best_feeder,
                    "route_2": best_direct,
                    "transfer_at": transfer_location
                }
                
        # If no better option found, fallback to direct (even if far)
        return {
            "type": "direct_far",
            "route_1": best_direct
        }

# Main Execution Flow
def main():
    json_data = None
    
    if IN_COLAB:
        print("Running in Google Colab.")
        from google.colab import files
        print("Please upload your 'Bus routes.json' file:")
        uploaded = files.upload()
        
        for filename in uploaded.keys():
            print(f"Loading {filename}...")
            # Detect encoding, usually utf-8 but being safe
            try:
                content = uploaded[filename].decode('utf-8')
            except:
                content = uploaded[filename] # already bytes
                
            json_data = json.loads(content)
            break
    else:
        # Local testing path - REPLACE with your actual path if running locally
        file_path = 'Bus routes.json' 
        print(f"Running locally. Looking for {file_path}...")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
        except FileNotFoundError:
            print(f"Error: {file_path} not found. Please place the file in the directory.")
            return

    if not json_data:
        print("No data loaded.")
        return

    # Initialize Optimizer
    optimizer = BusRouteOptimizer(json_data)

    # --- Benchmarking / Verification ---
    print("\n" + "="*30)
    print("SPEED VERIFICATION")
    print("="*30)
    
    # Test queries
    # Example: User near Pannipitiya (6.85, 79.95), wanting to go to "Malabe"
    user_lat = 6.85
    user_lon = 79.95
    target_dest = "Malabe"
    
    print(f"Scenario: User at ({user_lat}, {user_lon}), Destination: '{target_dest}'")
    
    # Measure single query time with new transfer logic
    start_q = time.time_ns()
    # We now call find_transfer_route instead of find_best_route directly for the final indication
    journey = optimizer.find_transfer_route(user_lat, user_lon, target_dest)
    end_q = time.time_ns()
    
    duration_ms = (end_q - start_q) / 1_000_000
    print(f"Query Time: {duration_ms:.4f} ms")
    
    if duration_ms < 5:
        print("✅ Status: VERY FAST (< 5ms)")
    else:
        print("⚠️ Status: Acceptable")

    if journey:
        j_type = journey['type']
        
        if j_type == 'direct' or j_type == 'direct_far':
            # Standard single bus output
            best = journey['route_1']
            stop = best['closest_stop']
            
            print(f"\n========================================")
            print(f"       RECOMMENDED ROUTE (DIRECT)       ")
            print(f"========================================")
            print(f"Route Number : {best['route_number']}")
            print(f"Destination  : {target_dest}")
            print(f"----------------------------------------")
            print(f"Your Pickup Stop:")
            print(f"  Name       : {stop['location_name']}")
            print(f"  Coordinates: {stop['latitude']}, {stop['longitude']}")
            print(f"  Distance   : {best['distance_meters']:.1f} m")
            print(f"----------------------------------------")
            
            if j_type == 'direct_far':
                print("⚠️ NOTE: The closest stop for this direct route is > 1000m away.")
                print("         We checked for feeder buses but found no better option.")
                
        elif j_type == 'transfer':
            # Two bus output
            feeder = journey['route_1']
            main_route = journey['route_2']
            transfer_loc = journey['transfer_at']
            main_stop = main_route['closest_stop']
            feeder_stop = feeder['closest_stop']
            
            print(f"\n========================================")
            print(f"      RECOMMENDED ROUTE (2 STEPS)       ")
            print(f"========================================")
            print(f"Reason: Direct stop '{transfer_loc}' is {main_route['distance_meters']:.1f}m away (Too far).")
            print(f"========================================")
            
            print(f"STEP 1: FEEDER BUS")
            print(f"  Route      : {feeder['route_number']}")
            print(f"  Action     : Go to pickup stop")
            print(f"  Pickup     : {feeder_stop['location_name']}")
            print(f"  Coordinates: {feeder_stop['latitude']}, {feeder_stop['longitude']}")
            print(f"  Distance   : {feeder['distance_meters']:.1f} m (from your location)")
            print(f"  Drop-off   : {transfer_loc}")
            print(f"----------------------------------------")
            
            print(f"STEP 2: MAIN BUS")
            print(f"  Route      : {main_route['route_number']}")
            print(f"  Action     : Transfer at {transfer_loc}")
            print(f"  Pickup     : {main_stop['location_name']}")
            print(f"  Coordinates: {main_stop['latitude']}, {main_stop['longitude']}")
            print(f"  Destination: {target_dest}")
            print(f"========================================")

    else:
        print("No routes found.")

    # Mass benchmark
    print("\nRunning 10,000 queries to test scalability (using direct route logic)...")
    start_mass = time.time()
    for _ in range(10000):
        optimizer.find_best_route(user_lat, user_lon, target_dest)
    end_mass = time.time()
    avg_time = (end_mass - start_mass) * 1000 / 10000
    print(f"Average time per query: {avg_time:.4f} ms")
    print("="*30)

if __name__ == "__main__":
    main()
