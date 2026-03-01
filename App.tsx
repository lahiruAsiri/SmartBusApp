// App.tsx - Entry Point
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync, setupGlobalNotificationListener } from './src/services/notificationService'; // Add this
import { syncIoTDataToFirestore } from './src/services/dbSyncService';

export default function App() {
  useEffect(() => {
    // Register notifications (runs once)
    registerForPushNotificationsAsync();
    // Setup global listeners (works on any screen)
    setupGlobalNotificationListener();

    // Start Realtime Database -> Firestore + Weather Sync
    const unsubscribeSync = syncIoTDataToFirestore();

    return () => {
      // Cleanup the realtime db listener when app unmounts
      if (unsubscribeSync) {
        unsubscribeSync();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}