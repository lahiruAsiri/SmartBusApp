import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Animated,
  Easing
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const DriverHomeScreen = ({ navigation }: any) => {
  const { userData, logout } = useAuth();
  const { colors, isDark } = useTheme();

  // State for driver operations
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [routeNumber, setRouteNumber] = useState('138');
  const [destination, setDestination] = useState('Pettah');
  const [startLocation, setStartLocation] = useState('Homagama');
  const [occupancy, setOccupancy] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for "Broadcasting" indicator
  useEffect(() => {
    if (isShiftActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isShiftActive]);

  const handleLogout = async () => {
    if (isShiftActive) {
      Alert.alert(
        'End Shift Required',
        'Please end your shift before logging out.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleShift = () => {
    if (!routeNumber || !destination || !startLocation) {
      Alert.alert('Missing Info', 'Please fill in all route details before starting your shift.');
      return;
    }

    if (isShiftActive) {
      Alert.alert(
        'End Shift',
        'Are you sure you want to end your shift? Your location will no longer be broadcast.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Shift', onPress: () => setIsShiftActive(false), style: 'destructive' }
        ]
      );
    } else {
      setIsShiftActive(true);
    }
  };

  const getOccupancyColor = (level: string) => {
    switch (level) {
      case 'Low': return '#22C55E';
      case 'Medium': return '#F59E0B';
      case 'High': return '#EF4444';
      default: return colors.text;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Driver Dashboard</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>
            Welcome, {userData?.displayName}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={[styles.logoutButton, { backgroundColor: colors.background }]}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: isShiftActive ? '#22C55E' + '15' : colors.card, borderColor: isShiftActive ? '#22C55E' : 'transparent', borderWidth: isShiftActive ? 1 : 0 }]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusLabel, { color: colors.textLight }]}>Current Status</Text>
              <View style={styles.statusValueContainer}>
                <View style={[styles.statusDot, { backgroundColor: isShiftActive ? '#22C55E' : colors.textLight }]} />
                <Text style={[styles.statusValue, { color: isShiftActive ? '#22C55E' : colors.text }]}>
                  {isShiftActive ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: '#22C55E' }}
              thumbColor={'#FFF'}
              ios_backgroundColor={colors.border}
              onValueChange={toggleShift}
              value={isShiftActive}
            />
          </View>
          
          {isShiftActive && (
            <View style={styles.broadcastingContainer}>
              <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={[styles.broadcastingText, { color: '#22C55E' }]}>
                Broadcasting live location...
              </Text>
            </View>
          )}
        </View>

        {/* Route Configuration */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Route Details</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textLight }]}>Route Number</Text>
              <View style={[styles.inputWrapper, { backgroundColor: isShiftActive ? colors.background : colors.background }]}>
                <Ionicons name="bus-outline" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={routeNumber}
                  onChangeText={setRouteNumber}
                  placeholder="Ex: 138"
                  placeholderTextColor={colors.textLight + '80'}
                  editable={!isShiftActive}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.inputLabel, { color: colors.textLight }]}>From</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
                  <Ionicons name="navigate-circle-outline" size={20} color={colors.textLight} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={startLocation}
                    onChangeText={setStartLocation}
                    placeholder="Start"
                    placeholderTextColor={colors.textLight + '80'}
                    editable={!isShiftActive}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textLight }]}>To</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={destination}
                    onChangeText={setDestination}
                    placeholder="End"
                    placeholderTextColor={colors.textLight + '80'}
                    editable={!isShiftActive}
                  />
                </View>
              </View>
            </View>

          </View>
        </View>

        {/* Live Controls - Only visible when Active */}
        {isShiftActive ? (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Passenger Occupancy</Text>
              <View style={[styles.card, { backgroundColor: colors.card, padding: 15 }]}>
                <View style={styles.occupancyButtons}>
                  <TouchableOpacity 
                    style={[styles.occButton, occupancy === 'Low' && { backgroundColor: '#22C55E', borderColor: '#22C55E' }]}
                    onPress={() => setOccupancy('Low')}
                  >
                    <Ionicons name="person-outline" size={24} color={occupancy === 'Low' ? '#FFF' : '#22C55E'} />
                    <Text style={[styles.occText, { color: occupancy === 'Low' ? '#FFF' : '#22C55E' }]}>Low</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.occButton, occupancy === 'Medium' && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}
                    onPress={() => setOccupancy('Medium')}
                  >
                    <Ionicons name="people-outline" size={24} color={occupancy === 'Medium' ? '#FFF' : '#F59E0B'} />
                    <Text style={[styles.occText, { color: occupancy === 'Medium' ? '#FFF' : '#F59E0B' }]}>Medium</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.occButton, occupancy === 'High' && { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
                    onPress={() => setOccupancy('High')}
                  >
                    <Ionicons name="alert-circle-outline" size={24} color={occupancy === 'High' ? '#FFF' : '#EF4444'} />
                    <Text style={[styles.occText, { color: occupancy === 'High' ? '#FFF' : '#EF4444' }]}>Full</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
                  <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' + '20' }]}>
                    <Ionicons name="car-outline" size={28} color="#F59E0B" />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>Report Traffic</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
                  <View style={[styles.actionIcon, { backgroundColor: '#EF4444' + '20' }]}>
                    <Ionicons name="construct-outline" size={28} color="#EF4444" />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>Breakdown</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
                  <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.primary} />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>Contact Ops</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.placeholderContainer, { borderColor: colors.border }]}>
            <Ionicons name="bus-outline" size={60} color={colors.textLight} />
            <Text style={[styles.placeholderText, { color: colors.textLight }]}>
              Go online to start your shift and access live controls.
            </Text>
          </View>
        )}

      </ScrollView>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  logoutButton: {
    padding: 10,
    borderRadius: 12,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTextContainer: {},
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statusValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  broadcastingContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    marginRight: 10,
  },
  broadcastingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  occupancyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  occButton: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  occText: {
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderContainer: {
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    marginTop: 10,
    opacity: 0.6,
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
});