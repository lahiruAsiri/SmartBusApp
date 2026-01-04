import AsyncStorage from '@react-native-async-storage/async-storage';

import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase';

interface UserData {
  email: string;
  displayName: string;
  role: 'user' | 'policeman' | 'driver';
  uid: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: 'user' | 'policeman' | 'driver') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  onboardingCompleted: boolean;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    // Check onboarding status on mount
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('@onboarding_completed');
        setOnboardingCompleted(completed === 'true');
      } catch (e) {
        console.error('Failed to load onboarding status');
      }
    };
    checkOnboarding();

    console.log('AuthContext: Setting up auth listener...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // ... (existing logic) ...
      console.log('AuthContext: onAuthStateChanged triggered - user:', !!firebaseUser);
      setUser(firebaseUser);

      if (firebaseUser) {
        console.log('AuthContext: Fetching user data for uid:', firebaseUser.uid);
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);

          // Add a timeout to the Firestore fetch
          const docPromise = getDoc(userDocRef);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 5000)
          );

          const userDoc = await Promise.race([docPromise, timeoutPromise]) as any;

          if (userDoc.exists()) {
            console.log('AuthContext: User data found');
            setUserData(userDoc.data() as UserData);
          } else {
            console.warn('AuthContext: User data doc NOT FOUND in users collection');
            setUserData(null);
          }
        } catch (err) {
          console.error('AuthContext: Error fetching user data:', err);
          setUserData(null);
        }
      } else {
        console.log('AuthContext: No user logged in');
        setUserData(null);
      }

      console.log('AuthContext: Setting loading to false');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('@onboarding_completed', 'true');
    setOnboardingCompleted(true);
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: 'user' | 'policeman' | 'driver'
  ): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;

      await setDoc(doc(db, 'users', uid), {
        email,
        displayName,
        role,
        uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signUp, signIn, logout, onboardingCompleted, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};