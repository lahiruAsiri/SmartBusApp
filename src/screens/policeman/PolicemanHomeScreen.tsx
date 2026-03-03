import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Vibration,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

// 1. GLOBAL NOTIFICATION CONFIGURATION
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Shared Data Structure
export let ViolationHistory = [
  { id: '1', busId: 'NA-1234', routeNumber: '138', speed: 72, location: { latitude: 6.9271, longitude: 79.8612 }, timestamp: new Date().toISOString() },
];

export const addViolation = (newViolation: any) => {
  const violationWithId = { 
    ...newViolation, 
    id: Math.random().toString(36).substr(2, 9) 
  };
  ViolationHistory = [violationWithId, ...ViolationHistory];
};

export const PolicemanHomeScreen = ({ navigation }: any) => {
  const { colors, toggleTheme, isDark } = useTheme();
  const { userData, logout } = useAuth();
  
  // States
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // 2. NOTIFICATION INTERACTION LOGIC
  useEffect(() => {
    // This listener triggers when a user TAPS the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data.busId) {
        navigation.navigate('PolicemanAlerts'); // Navigate to list or specific details
      }
    });

    return () => {
      responseListener.current && responseListener.current.remove();
    };
  }, []);

  // 3. LIVE SIMULATION LOOP (IoT Simulation)
  useEffect(() => {
    let interval: any;

    if (isOnDuty) {
      interval = setInterval(() => {
        // Mocking IoT Data from a bus
        const busIds = ['WP-NC-5544', 'NB-2231', 'SP-7788'];
        const randomBus = busIds[Math.floor(Math.random() * busIds.length)];
        const randomSpeed = 65 + Math.floor(Math.random() * 25);

        const newEntry = {
          busId: randomBus,
          routeNumber: '138',
          speed: randomSpeed,
          location: { latitude: 6.9271, longitude: 79.8612 },
          timestamp: new Date().toISOString(),
        };

        addViolation(newEntry);
        sendPushNotification(randomBus, randomSpeed);
        setRefresh(prev => prev + 1); // Update the counts on UI
      }, 15000); // New violation every 15 seconds
    }

    return () => clearInterval(interval);
  }, [isOnDuty]);

  const sendPushNotification = async (busId: string, speed: number) => {
    try {
      Vibration.vibrate(500);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 LIVE VIOLATION",
          body: `Bus ${busId} is over-speeding: ${speed} km/h`,
          data: { busId, speed },
        },
        trigger: null,
      });
    } catch (error) {
      // Expected in Expo Go - notifications will fail but violations still tracked
      console.log('⚠️ Notification skipped (Expo Go limitation)');
      // Vibration still works as fallback alert
    }
  };

  const toggleDutyStatus = async (value: boolean) => {
    if (value) {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Please enable location to start your duty.");
        return;
      }
      setIsOnDuty(true);
      Vibration.vibrate(100);
    } else {
      setIsOnDuty(false);
    }
  };

  const handleQuickAction = (name: string) => {
    if (!isOnDuty) {
      Alert.alert("Shift Not Started", "Please toggle ON DUTY status to access police tools.");
      return;
    }
    Alert.alert("Action Triggered", `${name} mode activated.`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Duty Toggle */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Traffic Police Portal</Text>
          <Text style={styles.officerName}>Officer {userData?.displayName || 'Perera'}</Text>
          
          <View style={styles.dutyToggleContainer}>
            <Switch
              value={isOnDuty}
              onValueChange={toggleDutyStatus}
              trackColor={{ false: "#767577", true: "#34C759" }}
              thumbColor={isOnDuty ? "#FFF" : "#f4f3f4"}
            />
            <Text style={[styles.dutyText, { color: isOnDuty ? '#34C759' : '#FFD60A' }]}>
              {isOnDuty ? "• ON DUTY" : "• OFF DUTY"}
            </Text>
          </View>
        </View>

        {/* Theme Toggle Button */}
        <TouchableOpacity 
          style={styles.themeToggleBtn}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isDark ? "sunny" : "moon"} 
            size={24} 
            color="#FFF" 
          />
        </TouchableOpacity>

        <View style={styles.badgeContainer}>
          <View style={styles.policeBadge}>
            <Ionicons name="shield" size={36} color="#FFF" />
          </View>
          <Text style={styles.badgeText}>SRI LANKA POLICE</Text>
        </View>
      </View>

      <View style={styles.content}>
        {!isOnDuty && (
          <View style={styles.statusBanner}>
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <Text style={styles.statusBannerText}>Switch to ON DUTY to begin real-time tracking</Text>
          </View>
        )}

        {/* Expo Go Notification Warning */}
        <View style={[styles.statusBanner, { backgroundColor: '#DBEAFE', marginBottom: 15 }]}>
          <Ionicons name="information-circle" size={18} color="#1E40AF" />
          <Text style={[styles.statusBannerText, { color: '#1E3A8A', fontSize: 11 }]}>
            ℹ️ Running in Expo Go: Violations tracked, but push notifications limited. Use dev build for full features.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#EF444420' }]}>
            <Ionicons name="alert-circle" size={40} color="#EF4444" />
            <Text style={styles.statNumber}>{isOnDuty ? ViolationHistory.length : 0}</Text>
            <Text style={styles.statLabel}>Active Alerts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="warning" size={40} color="#F59E0B" />
            <Text style={styles.statNumber}>{isOnDuty ? ViolationHistory.length : 0}</Text>
            <Text style={styles.statLabel}>Daily Fines</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#22C55E20' }]}>
            <Ionicons name="bus" size={40} color="#22C55E" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Buses in Area</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#8B5CF620' }]}>
            <Ionicons name="flame" size={40} color="#8B5CF6" />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Risk Level</Text>
          </View>
        </View>

        {/* Monitoring Tools */}
        <View style={[styles.toolsCard, { backgroundColor: colors.card }]}>
          <Text style={styles.sectionTitle}>Enforcement Tools</Text>
          <TouchableOpacity 
            style={[styles.toolItem, !isOnDuty && { opacity: 0.4 }]} 
            onPress={() => isOnDuty ? navigation.navigate('Map') : null}
          >
            <View style={styles.toolLeft}>
              <Ionicons name="map" size={28} color={colors.primary} />
              <View>
                <Text style={styles.toolTitle}>Live Tracking Map</Text>
                <Text style={styles.toolDesc}>Monitor buses in your current sector</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toolItem, !isOnDuty && { opacity: 0.4 }]} 
            onPress={() => isOnDuty ? navigation.navigate('PolicemanAlerts') : null}
          >
            <View style={styles.toolLeft}>
              <Ionicons name="list" size={28} color="#FF3B30" />
              <View>
                <Text style={styles.toolTitle}>Recent Violations</Text>
                <Text style={styles.toolDesc}>View logs and generate digital fines</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolItem} 
            onPress={() => navigation.navigate('InvestigationNote')}
          >
            <View style={styles.toolLeft}>
              <Ionicons name="document-text" size={28} color="#8B5CF6" />
              <View>
                <Text style={styles.toolTitle}>Submit New Note</Text>
                <Text style={styles.toolDesc}>Log a physical fine ticket issued on-site</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolItem} 
            onPress={() => navigation.navigate('MyInvestigationNotes')}
          >
            <View style={styles.toolLeft}>
              <Ionicons name="folder-open" size={28} color="#0EA5E9" />
              <View>
                <Text style={styles.toolTitle}>My Notes Archive</Text>
                <Text style={styles.toolDesc}>View investigation notes you've issued</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleQuickAction('Emergency')}>
              <Ionicons name="call" size={28} color={colors.primary} />
              <Text style={styles.actionText}>Emergency</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleQuickAction('Evidence')}>
              <Ionicons name="camera" size={28} color={colors.primary} />
              <Text style={styles.actionText}>Evidence</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleQuickAction('Radio')}>
              <Ionicons name="radio" size={28} color={colors.primary} />
              <Text style={styles.actionText}>Radio HQ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('InvestigationNote')}
            >
              <Ionicons name="document-text" size={28} color={colors.primary} />
              <Text style={styles.actionText}>Invest. Note</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>End Shift & Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30, flexDirection: 'row', justifyContent: 'space-between' },
  greeting: { fontSize: 14, color: '#FFF', opacity: 0.8 },
  officerName: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  dutyToggleContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  dutyText: { fontSize: 13, fontWeight: '800' },
  themeToggleBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginHorizontal: 10,
  },
  badgeContainer: { alignItems: 'center' },
  policeBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 9, marginTop: 5, textAlign: 'center', fontWeight: 'bold' },
  content: { padding: 20 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginBottom: 20, gap: 10 },
  statusBannerText: { color: '#92400E', fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', padding: 15, borderRadius: 16, alignItems: 'center', marginBottom: 15 },
  statNumber: { fontSize: 32, fontWeight: 'bold', marginVertical: 5 },
  statLabel: { fontSize: 12, color: '#666' },
  toolsCard: { borderRadius: 20, padding: 20, marginBottom: 20, elevation: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  toolItem: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  toolLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  toolTitle: { fontSize: 16, fontWeight: '600' },
  toolDesc: { fontSize: 12, color: '#666' },
  actionsCard: { borderRadius: 20, padding: 20, marginBottom: 30, elevation: 4 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', width: '23%' },
  actionText: { fontSize: 10, marginTop: 5, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#EF4444' },
  logoutText: { color: '#EF4444', fontWeight: 'bold', marginLeft: 10 }
});