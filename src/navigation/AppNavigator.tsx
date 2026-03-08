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
import { DriverProfileForPoliceScreen } from '@/screens/policeman/DriverProfileForPoliceScreen';
import { InvestigationNoteScreen } from '@/screens/policeman/InvestigationNoteScreen';
import { MyInvestigationNotesScreen } from '@/screens/policeman/MyInvestigationNotesScreen';
import { DriverRewardsScreen } from '@/screens/driver/DriverRewardsScreen';
import { DriverAchievementsScreen } from '@/screens/driver/DriverAchievementsScreen';
import { DriverLeaderboardScreen } from '@/screens/driver/DriverLeaderboardScreen';
import { DriverFinesScreen } from '@/screens/driver/DriverFinesScreen';

import { TripResultScreen } from '../screens/user/TripResultScreen';
import { TripMapScreen } from '../screens/user/TripMapScreen';
import { SavedAddressesScreen } from '../screens/user/SavedAddressesScreen';
import { AddAddressMapScreen } from '../screens/user/AddAddressMapScreen';
import { ChatScreen } from '../screens/user/ChatScreen';
import { LocationPickerScreen } from '../screens/user/LocationPickerScreen';


import { useAuth } from '../contexts/AuthContext';
import { getBooleanItem } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/config';
import { COLORS } from '../constants/colors';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { user, userData, loading, onboardingCompleted } = useAuth();

  // Log state for debugging
  console.log('AppNavigator: Rendering state - loading:', loading, 'onboarding:', onboardingCompleted, 'user:', !!user);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
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
            <Stack.Screen name="BusDetails" component={BusDetailsScreen} />
            <Stack.Screen name="PolicemanAlerts" component={PolicemanAlertsScreen} />
            <Stack.Screen name="BusViolationDetails" component={BusViolationDetailsScreen} />
            <Stack.Screen name="DriverProfileForPolice" component={DriverProfileForPoliceScreen} />
            <Stack.Screen name="InvestigationNote" component={InvestigationNoteScreen} />
            <Stack.Screen name="MyInvestigationNotes" component={MyInvestigationNotesScreen} />
          </>
        ) : userData?.role === 'driver' ? (
          <>
            <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
            <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
            <Stack.Screen name="DriverRewards" component={DriverRewardsScreen} />
            <Stack.Screen name="DriverAchievements" component={DriverAchievementsScreen} />
            <Stack.Screen name="DriverLeaderboard" component={DriverLeaderboardScreen} />
            <Stack.Screen name="DriverFines" component={DriverFinesScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
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
            <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};