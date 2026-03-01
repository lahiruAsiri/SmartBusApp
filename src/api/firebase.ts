import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { FIREBASE_CONFIG } from '../constants/config';

// Initialize Firebase App
const app = initializeApp(FIREBASE_CONFIG);

// Initialize Auth (standard web SDK works in React Native via Expo)
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Realtime Database
export const database = getDatabase(app);

// Initialize Cloud Storage
export const storage = getStorage(app);

export default app;
