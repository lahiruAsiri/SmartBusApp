// src/services/notificationService.ts (SDK 53 Compatible)
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
  if (!Device.isDevice) {
    console.log('Expo Go: Use real device for full push');
    return;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Notifications needed for speeding alerts!');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('speeding-alerts', {
      name: 'Speeding Violations',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF3B30',
    });
  }

  // Get token (for remote push in dev build)
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })).data;
  console.log('Push Token:', token);
  return token;
}

export function setupGlobalNotificationListener() {
  // Foreground: Vibrate on receive (e.g., Home Screen)
  Notifications.addNotificationReceivedListener(notification => {
    Vibration.vibrate([0, 500, 200, 500]);
  });

  // Tap: Log for now (add navigation ref if needed)
  Notifications.addNotificationResponseReceivedListener(response => {
    Vibration.vibrate([0, 600, 200, 600]);
    console.log('Tapped alert:', response.notification.request.content.data);
  });
}

// Trigger instant local alert (call on violation)
export async function triggerSpeedingAlert(busData: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 Speeding Violation!',
      body: `${busData.busId} • Route ${busData.routeNumber} • ${busData.speed} km/h`,
      sound: true,
      badge: 1,
      data: { screen: 'PolicemanAlerts' },
    },
    trigger: null, // Instant
  });
  Vibration.vibrate([0, 500, 200, 500]);
}