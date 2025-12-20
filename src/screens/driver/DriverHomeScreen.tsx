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
import { ViolationHistory } from '../policeman/PolicemanHomeScreen';

export const DriverHomeScreen = ({ navigation }: any) => {
  const { userData, logout } = useAuth();
  const { colors, isDark } = useTheme();

  // Driver Operations
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [routeNumber, setRouteNumber] = useState('138');
  const [destination, setDestination] = useState('Pettah');
  const [startLocation, setStartLocation] = useState('Homagama');
  const [occupancy, setOccupancy] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [pulseAnim] = useState(new Animated.Value(1));

  // Performance Calculation
  const myViolations = ViolationHistory.filter(v => v.busId === userData?.uid || v.busId === 'NA-1234');
  const totalViolations = myViolations.length;
  const totalTrips = 30;
  const riskScore = totalViolations === 0 ? 0 : Math.min(100, Math.round((totalViolations / totalTrips) * 100));
  const daysSafe = myViolations.length === 0 ? 30 : Math.floor((Date.now() - new Date(myViolations[0]?.timestamp || Date.now()).getTime()) / 86400000);

  // Pulse Animation
  useEffect(() => {
    if (isShiftActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isShiftActive]);

  const handleLogout = async () => {
    if (isShiftActive) {
      Alert.alert('End Shift Required', 'Please end your shift before logging out.', [{ text: 'OK' }]);
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
        'Are you sure you want to end your shift?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Shift', onPress: () => setIsShiftActive(false), style: 'destructive' }
        ]
      );
    } else {
      setIsShiftActive(true);
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

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Performance Summary Card */}
        <TouchableOpacity
          style={[styles.performanceCard, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('DriverProfile')}
        >
          <Text style={styles.perfTitle}>My Performance Summary</Text>
          <Text style={[styles.riskScore, { color: riskScore < 50 ? '#22C55E' : '#EF4444' }]}>
            {riskScore}
          </Text>
          <Text style={styles.scoreLabel}>Risk Score</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBig}>{totalViolations}</Text>
              <Text style={styles.statSmall}>Violations</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBig}>{daysSafe}</Text>
              <Text style={styles.statSmall}>Days Safe</Text>
            </View>
          </View>
          <Text style={styles.viewAll}>Tap to view full history -&gt;</Text>
        </TouchableOpacity>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: isShiftActive ? '#22C55E15' : colors.card }]}>
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
            <Switch value={isShiftActive} onValueChange={toggleShift} />
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
              <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
                <Ionicons name="bus-outline" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={routeNumber}
                  onChangeText={setRouteNumber}
                  placeholder="Ex: 138"
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
                    editable={!isShiftActive}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Live Controls */}
        {isShiftActive && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Passenger Occupancy</Text>
              <View style={[styles.card, { backgroundColor: colors.card, padding: 15 }]}>
                <View style={styles.occupancyButtons}>
                  {(['Low', 'Medium', 'High'] as const).map(level => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.occButton, occupancy === level && { backgroundColor: getOccupancyColor(level), borderColor: getOccupancyColor(level) }]}
                      onPress={() => setOccupancy(level)}
                    >
                      <Ionicons name={level === 'Low' ? 'person-outline' : level === 'Medium' ? 'people-outline' : 'alert-circle-outline'} size={24} color={occupancy === level ? '#FFF' : getOccupancyColor(level)} />
                      <Text style={[styles.occText, { color: occupancy === level ? '#FFF' : getOccupancyColor(level) }]}>{level}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
                  <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
                    <Ionicons name="car-outline" size={28} color="#F59E0B" />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>Report Traffic</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
                  <View style={[styles.actionIcon, { backgroundColor: '#EF444420' }]}>
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
        )}
      </ScrollView>
    </View>
  );
};

const getOccupancyColor = (level: string) => {
  switch (level) {
    case 'Low': return '#22C55E';
    case 'Medium': return '#F59E0B';
    case 'High': return '#EF4444';
    default: return '#666';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  logoutButton: { padding: 10, borderRadius: 12 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  performanceCard: { borderRadius: 20, padding: 28, alignItems: 'center', elevation: 8, marginBottom: 24 },
  perfTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  riskScore: { fontSize: 72, fontWeight: 'bold' },
  scoreLabel: { fontSize: 16, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 40 },
  statBox: { alignItems: 'center' },
  statBig: { fontSize: 36, fontWeight: 'bold' },
  statSmall: { fontSize: 14, color: '#666' },
  viewAll: { marginTop: 20, fontSize: 16, color: '#0066CC', fontWeight: '600' },
  statusCard: { borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusTextContainer: {},
  statusLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statusValueContainer: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusValue: { fontSize: 18, fontWeight: '800' },
  broadcastingContainer: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pulseCircle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', marginRight: 10 },
  broadcastingText: { fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginLeft: 4 },
  card: { borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 50 },
  input: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '600' },
  occupancyButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  occButton: { flex: 1, height: 80, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', gap: 6 },
  occText: { fontSize: 14, fontWeight: '700' },
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionButton: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});