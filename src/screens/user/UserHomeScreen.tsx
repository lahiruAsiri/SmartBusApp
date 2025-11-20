import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,          // ← added for better layout
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ← NEW
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { STORAGE_KEYS } from '../../constants/config';                 // ← NEW

export const UserHomeScreen = ({ navigation }: any) => {
  const { userData, logout } = useAuth();

  // 🔥 DEV-ONLY RESET BUTTON FUNCTION
  const resetAppDev = () => {
    Alert.alert(
      '🔄 Reset App (Dev Only)',
      'This will log you out and show the onboarding screen again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Now',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
              if (logout) await logout();
              Alert.alert('Done!', 'App has been reset. Restarting flow...');
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userData?.displayName}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>USER</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Access</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={styles.menuItemText}>View Bus Map</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <Text style={styles.menuItemTextDisabled}>Search Routes</Text>
            <Text style={styles.comingSoon}>Coming Soon</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuItemTextDisabled}>My Favorites</Text>
            <Text style={styles.comingSoon}>Coming Soon</Text>
          </View>
        </View>

        {/* ←←← THE NEW DEV BUTTON (only visible in development) ←←← */}
        {__DEV__ && (
          <TouchableOpacity
            onPress={resetAppDev}
            style={styles.devResetButton}
          >
            <Text style={styles.devResetText}>🔄 Reset App (Dev Only)</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 4,
  },
  badge: {
    backgroundColor: COLORS.white + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  menuItemTextDisabled: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.primary,
  },
  comingSoon: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },

  // ←←← NEW DEV BUTTON STYLE ←←←
  devResetButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  devResetText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  logoutButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
});