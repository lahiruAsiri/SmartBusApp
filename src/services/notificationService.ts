// src/services/notificationService.ts
// SDK 53+ Compatible - Expo Go Detection for Push Notifications
// 
// IMPORTANT: Remote push notifications do NOT work in Expo Go (SDK 53+)
// - Local notifications: ✅ Work in Expo Go
// - Remote push notifications: ❌ Require development build
// 
// To use remote push notifications:
// 1. Run: npx expo run:android (creates dev build)
// 2. Or build with EAS: npx eas build --profile development
// 3. See: https://docs.expo.dev/develop/development-builds/introduction/

import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Handler (works on any screen)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {
    // Check if running in Expo Go FIRST - more reliable detection
    // In SDK 53+, executionEnvironment is the recommended way to detect Expo Go
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    
    if (isExpoGo) {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║  📱 Running in Expo Go                                     ║');
      console.log('║  ✅ Local notifications: ENABLED                           ║');
      console.log('║  ⚠️  Remote push notifications: NOT AVAILABLE              ║');
      console.log('║                                                            ║');
      console.log('║  To enable remote push notifications:                     ║');
      console.log('║  1. Run: npx expo run:android                             ║');
      console.log('║  2. Or create a development build                         ║');
      console.log('║  3. See: https://docs.expo.dev/develop/development-builds/║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      
      // Still request permissions for local notifications
      if (Device.isDevice) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('⚠️ Notifications permission not granted');
          return null;
        }
        
        // Set up Android notification channel for local notifications
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('speeding-alerts', {
            name: 'Speeding Violations',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF3B30',
          });
        }
      }
      
      return null; // Exit early - do NOT call getExpoPushTokenAsync
    }

    // From here on, we're in a development or production build
    if (!Device.isDevice) {
      console.log('⚠️ Notifications: Running on simulator/emulator');
      return null;
    }

    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notifications permission not granted');
      return null;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('speeding-alerts', {
        name: 'Speeding Violations',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF3B30',
      });
    }

    // Get push token for development/production builds
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.log('ℹ️ No EAS projectId configured - skipping push token registration');
      console.log('ℹ️ Local notifications will still work');
      return null;
    }

    try {
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;
      console.log('✅ Push Token:', token);
      return token;
    } catch (tokenError) {
      console.log('⚠️ Could not get push token:', tokenError);
      return null;
    }
  } catch (error) {
    console.error('❌ Notification registration error:', error);
    return null;
  }
}

export function setupGlobalNotificationListener() {
  try {
    // Foreground: Vibrate on receive (e.g., Home Screen)
    Notifications.addNotificationReceivedListener(notification => {
      try {
        Vibration.vibrate([0, 500, 200, 500]);
      } catch (err) {
        console.log('Vibration error:', err);
      }
    });

    // Tap: Log for now (add navigation ref if needed)
    Notifications.addNotificationResponseReceivedListener(response => {
      try {
        Vibration.vibrate([0, 600, 200, 600]);
        console.log('Tapped alert:', response.notification.request.content.data);
      } catch (err) {
        console.log('Notification response error:', err);
      }
    });
  } catch (error) {
    console.error('❌ Failed to setup notification listeners:', error);
  }
}

// Trigger instant local alert (call on violation)
export async function triggerSpeedingAlert(busData: any) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Speeding Violation!',
        body: `${busData.busId} | Route ${busData.routeNumber} | ${busData.speed} km/h`,
        sound: true,
        badge: 1,
        data: { screen: 'PolicemanAlerts' },
      },
      trigger: null, // Instant
    });
    Vibration.vibrate([0, 500, 200, 500]);
  } catch (error) {
    console.log('⚠️ Could not send notification (expected in Expo Go)');
    // Still vibrate to alert user
    try {
      Vibration.vibrate([0, 500, 200, 500]);
    } catch (vibError) {
      console.log('Vibration error:', vibError);
    }
  }
}