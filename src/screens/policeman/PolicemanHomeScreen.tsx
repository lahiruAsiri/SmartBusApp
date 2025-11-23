// File: src/screens/policeman/PolicemanHomeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export const PolicemanHomeScreen = ({ navigation }: any) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { userData, logout } = useAuth();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primary}
      />

      {/* Header with Theme Toggle */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.greeting}>Officer Portal</Text>
          <Text style={styles.userName}>{userData?.displayName || 'Officer'}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>POLICEMAN</Text>
          </View>

          {/* Theme Toggle Button */}
          <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={26}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Monitoring Tools Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Monitoring Tools</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>Live Bus Tracking</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <Text style={[styles.menuItemTextDisabled, { color: colors.textLight }]}>
              Incident Reports
            </Text>
            <Text style={[styles.comingSoon, { color: colors.textLight }]}>Coming Soon</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={[styles.menuItemTextDisabled, { color: colors.textLight }]}>
              Route Analysis
            </Text>
            <Text style={[styles.comingSoon, { color: colors.textLight }]}>Coming Soon</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={[styles.menuItemTextDisabled, { color: colors.textLight }]}>
              Traffic Control
            </Text>
            <Text style={[styles.comingSoon, { color: colors.textLight }]}>Coming Soon</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Officer Features
          </Text>
          <Text style={[styles.infoText, { color: colors.textLight }]}>
            Advanced monitoring and control features will be available in future updates.
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  themeButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '600',
  },
  menuItemTextDisabled: {
    fontSize: 17,
    fontWeight: '500',
    opacity: 0.6,
  },
  arrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  comingSoon: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
  },
  logoutButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '700',
  },
});