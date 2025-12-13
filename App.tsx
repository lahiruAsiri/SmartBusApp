// App.tsx (FINAL VERSION — NO NESTING ERROR)
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync, setupGlobalNotificationListener } from './src/services/notificationService'; // Add this

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
          <AppNavigator />  {/* Your navigator already has NavigationContainer */}
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}