// File: src/constants/config.ts (Updated)
import Constants from 'expo-constants';
import * as Location from 'expo-location';

const { firebaseConfig } = Constants?.expoConfig?.extra || {};

if (!firebaseConfig) {
  throw new Error('Firebase config not loaded! Check your app.config.js and .env');
}

export const FIREBASE_CONFIG = firebaseConfig as {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

// Default fallback location (Negombo, Sri Lanka)
const DEFAULT_LOCATION = {
  latitude: 7.2906,
  longitude: 79.8570,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const getInitialMapRegion = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Location permission not granted, using default location');
      return DEFAULT_LOCATION;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return DEFAULT_LOCATION;
  }
};

// ============================================
// MULTIPLE OSM TILE SERVER OPTIONS
// ============================================

export const MAP_CONFIG = {
  initialRegion: DEFAULT_LOCATION,
  defaultLocation: DEFAULT_LOCATION,
  
  // OPTION 1: Carto CDN (Best for production - No restrictions)
  osmTileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  
  // OPTION 2: Alternative tile servers (uncomment to use)
  // osmTileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',  // Original (blocked on some Android)
  // osmTileUrl: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',  // Humanitarian style
  // osmTileUrl: 'https://tiles.wmflabs.org/osm/{z}/{x}/{y}.png',  // Wikimedia tiles
  
  // Tile subdomains for load balancing
  tileSubdomains: ['a', 'b', 'c'],
  
  // User agent for OSM compliance
  userAgent: 'SmartBusApp/1.0 (lahiru@example.com)',  // Replace with your email
};

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: '@onboarding_completed',
  USER_ROLE: '@user_role',
  LAST_LOCATION: '@last_location',
};