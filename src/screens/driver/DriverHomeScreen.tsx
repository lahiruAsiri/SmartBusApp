import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const DriverHomeScreen = ({ navigation }: any) => {
  const { userData, logout } = useAuth();
  const { colors, isDark } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Driver Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={colors.error || '#EF4444'} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Welcome back, {userData?.displayName}!
          </Text>
          <Text style={[styles.roleText, { color: colors.textLight }]}>
            Role: Bus Driver
          </Text>
          <Text style={[styles.infoText, { color: colors.textLight }]}>
            Driver features and dashboard will be implemented here.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
