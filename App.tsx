// App.tsx - Entry Point
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync, setupGlobalNotificationListener } from './src/services/notificationService';
import { DataSyncManager } from './src/components/DataSyncManager';

export default function App() {
  useEffect(() => {
    // Register notifications (runs once)
    registerForPushNotificationsAsync();
    // Setup global listeners (works on any screen)
    setupGlobalNotificationListener();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <DataSyncManager>
              <AppNavigator />
            </DataSyncManager>
          </LocationProvider>
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}