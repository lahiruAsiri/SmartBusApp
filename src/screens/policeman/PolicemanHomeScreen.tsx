import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// Global Permanent History
export const ViolationHistory: any[] = [];
export const addViolation = (violation: any) => {
  ViolationHistory.push({ ...violation, id: Date.now().toString() });
};

export const PolicemanHomeScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { userData, logout } = useAuth();
  const [alertCount, setAlertCount] = useState(ViolationHistory.length);

  useEffect(() => {
    const interval = setInterval(() => {
      if (ViolationHistory.length > alertCount) {
        Vibration.vibrate([0, 600, 200, 600]);
        setAlertCount(ViolationHistory.length);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [alertCount]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout(); // This will redirect to Login screen automatically
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.greeting}>Officer Portal</Text>
          <Text style={styles.userName}>
            {userData?.displayName || 'Officer'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={styles.badge}><Text style={styles.badgeText}>POLICEMAN</Text></View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Monitoring Tools</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Map')}>
            <Text style={[styles.menuItemText, { color: colors.text }]}>Live Bus Tracking</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PolicemanAlerts')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="alert-circle" size={24} color="#FF3B30" />
              <Text style={[styles.menuItemText, { color: colors.text, fontWeight: '600' }]}>
                Violation History
              </Text>
              {alertCount > 0 && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>{alertCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON — WORKING 100% */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: '#FF3B30' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={[styles.logoutText, { color: '#FF3B30' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30, flexDirection: 'row', justifyContent: 'space-between' },
  greeting: { fontSize: 16, color: '#FFF', opacity: 0.9 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  badge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  card: { borderRadius: 20, padding: 24, marginBottom: 20, elevation: 8 },
  cardTitle: { fontSize: 19, fontWeight: '700', marginBottom: 20 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  menuItemText: { fontSize: 17, fontWeight: '600' },
  arrow: { fontSize: 24 },
  alertBadge: { backgroundColor: '#FF3B30', minWidth: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  alertBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 2, gap: 10 },
  logoutText: { fontSize: 18, fontWeight: 'bold' },
});