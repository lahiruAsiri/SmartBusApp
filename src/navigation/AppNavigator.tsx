import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { UserHomeScreen } from '../screens/user/UserHomeScreen';
import { BusDetailsScreen } from '../screens/user/BusDetailsScreen';
import { PolicemanHomeScreen } from '../screens/policeman/PolicemanHomeScreen';
import { DriverHomeScreen } from '../screens/driver/DriverHomeScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { PolicemanAlertsScreen } from '@/screens/policeman/PolicemanAlertsScreen';
import { SettingsScreen } from '../screens/user/SettingsScreen';
import { BusViolationDetailsScreen } from '@/screens/policeman/BusViolationDetailsScreen';
import { DriverProfileScreen } from '@/screens/driver/DriverProfileScreen';
import { TripResultScreen } from '../screens/user/TripResultScreen';
import { TripMapScreen } from '../screens/user/TripMapScreen';
import { SavedAddressesScreen } from '../screens/user/SavedAddressesScreen';
import { AddAddressMapScreen } from '../screens/user/AddAddressMapScreen';
import { ChatScreen } from '../screens/user/ChatScreen';


import { useAuth } from '../contexts/AuthContext';
import { getBooleanItem } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/config';
import { COLORS } from '../constants/colors';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { user, userData, loading } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      console.log('AppNavigator: Checking onboarding...');
      try {
        const completed = await getBooleanItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
        console.log('AppNavigator: Onboarding status:', completed);
        setOnboardingCompleted(completed ?? false); // Fallback to false if null
      } catch (err) {
        console.error('AppNavigator: Onboarding check failed:', err);
        setOnboardingCompleted(false);
      }
    };
    checkOnboarding();
  }, []);

  console.log('AppNavigator: Rendering state - loading:', loading, 'onboarding:', onboardingCompleted, 'user:', !!user, 'userData:', !!userData);

  if (loading || onboardingCompleted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (user && !userData) {
    // If loading is finished but we still have no userData, it usually means a permission error
    // or the user document doesn't exist. We allow them to go to Login to re-authenticate or fix it.
    if (!loading) {
      console.log('AppNavigator: User authenticated but no userData found. Falling back to Login.');
    } else {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingCompleted ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (!user || !userData) ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : userData?.role === 'policeman' ? (
          <>
            <Stack.Screen name="PolicemanHome" component={PolicemanHomeScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="PolicemanAlerts" component={PolicemanAlertsScreen} />
            <Stack.Screen name="BusViolationDetails" component={BusViolationDetailsScreen} />
          </>
        ) : userData?.role === 'driver' ? (
          <>
            <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
            <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="UserHome" component={UserHomeScreen} />
            <Stack.Screen name="BusDetails" component={BusDetailsScreen} />
            <Stack.Screen name="TripResult" component={TripResultScreen} />
            <Stack.Screen name="TripMap" component={TripMapScreen} />
            <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
            <Stack.Screen name="AddAddressMap" component={AddAddressMapScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};