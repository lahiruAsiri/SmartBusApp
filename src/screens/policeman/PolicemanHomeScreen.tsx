import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';

export const PolicemanHomeScreen = ({ navigation }: any) => {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Officer Portal</Text>
          <Text style={styles.userName}>{userData?.displayName}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>POLICEMAN</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monitoring Tools</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={styles.menuItemText}>Live Bus Tracking</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <Text style={styles.menuItemTextDisabled}>Incident Reports</Text>
            <Text style={styles.comingSoon}>Coming Soon</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuItemTextDisabled}>Route Analysis</Text>
            <Text style={styles.comingSoon}>Coming Soon</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuItemTextDisabled}>Traffic Control</Text>
            <Text style={styles.comingSoon}>Coming Soon</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Officer Features</Text>
          <Text style={styles.infoText}>
            Advanced monitoring and control features will be available in future updates.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: '#1565C0', // Different color for policeman
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
  infoCard: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
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