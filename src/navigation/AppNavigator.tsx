import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { UserHomeScreen } from '../screens/user/UserHomeScreen';
import { PolicemanHomeScreen } from '../screens/policeman/PolicemanHomeScreen';
import { MapScreen } from '../screens/map/MapScreen';

import { useAuth } from '../contexts/AuthContext';
import { getBooleanItem } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/config';
import { COLORS } from '../constants/colors';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { user, userData, loading } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Initial check
  useEffect(() => {
    const check = async () => {
      const completed = await getBooleanItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      setOnboardingCompleted(completed ?? false);
    };
    check();
  }, []);

  // ← THIS IS THE KEY: Listen for storage changes in real-time
  useEffect(() => {
    const interval = setInterval(async () => {
      const completed = await getBooleanItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      if (completed === true && onboardingCompleted !== true) {
        setOnboardingCompleted(true);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [onboardingCompleted]);

  if (loading || onboardingCompleted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingCompleted ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : userData?.role === 'policeman' ? (
          <>
            <Stack.Screen name="PolicemanHome" component={PolicemanHomeScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="UserHome" component={UserHomeScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};