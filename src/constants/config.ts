// src/constants/config.ts
import Constants from 'expo-constants';

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

export const MAP_CONFIG = {
  initialRegion: {
    latitude: 7.2906,
    longitude: 79.8570,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  osmTileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
};

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: '@onboarding_completed',
  USER_ROLE: '@user_role',
};