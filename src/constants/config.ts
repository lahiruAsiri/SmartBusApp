// File: src/constants/config.ts
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

// Get user's current location or use default
export const getInitialMapRegion = async () => {
  try {
    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Location permission not granted, using default location');
      return DEFAULT_LOCATION;
    }

    // Get current position
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

// Static default for initial load
export const MAP_CONFIG = {
  initialRegion: DEFAULT_LOCATION,
  osmTileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  defaultLocation: DEFAULT_LOCATION,
};

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: '@onboarding_completed',
  USER_ROLE: '@user_role',
  LAST_LOCATION: '@last_location', // Store last known location
};