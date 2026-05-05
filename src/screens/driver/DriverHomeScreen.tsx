// src/screens/driver/DriverHomeScreen.tsx
// FINAL VERSION — PERFORMANCE SUMMARY FROM dummyViolations.ts

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
import { getDriverRewardData, DriverRewardData } from '../../services/rewardService';
import { database } from '../../api/firebase';
import { ref, onValue, off } from 'firebase/database';

export const DriverHomeScreen = ({ navigation }: any) => {
  const { userData, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  // Driver Operations
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [routeNumber, setRouteNumber] = useState('138');
  const [destination, setDestination] = useState('Pettah');
  const [startLocation, setStartLocation] = useState('Homagama');
  const [occupancy, setOccupancy] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [pulseAnim] = useState(new Animated.Value(1));

  // Live Data State
  const [driverData, setDriverData] = useState<DriverRewardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Real-time Firebase listener — re-fetches whenever Bus_01/violations changes
  useEffect(() => {
    const violationsRef = ref(database, 'Bus_01/violations');
    const unsubscribe = onValue(violationsRef, async () => {
      try {
        const data = await getDriverRewardData();
        setDriverData(data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    });
    return () => off(violationsRef);
  }, []);

  // PERFORMANCE CALCULATIONS (from Live Data)
  const totalViolations = driverData?.totalViolations ?? 0;
  const speedingCount = driverData?.rawSpeeding ?? 0;
  const harshAccelCount = driverData?.rawHarshAccel ?? 0;
  const suddenBrakeCount = driverData?.rawSuddenBrake ?? 0;
  const daysSafe = driverData?.currentStreak ?? 0;

  // RL model results embedded in driverData (no second API call needed)
  const safetyScore = driverData?.safetyScore ?? 100;
  const currentTier = driverData?.currentTier ?? 'Standard';
  const pointsEarned = driverData?.totalPoints ?? 0;
  const monthlyBonus = driverData?.currentMonthBonus ?? 0;

  // EARNINGS DATA (Dummy)
  const todayEarnings = 2450;
  const earningsTarget = 3000;
  const tripsToday = 12;
  const avgEarningsPerTrip = Math.round(todayEarnings / tripsToday);
  const earningsProgress = Math.round((todayEarnings / earningsTarget) * 100);

  // WEATHER DATA (Dummy)
  const weatherAlert = {
    hasAlert: true,
    condition: 'Heavy Rain',
    route: 'Homagama → Pettah',
    warnings: ['Flooding risk: Baseline Road', 'Traffic delays expected'],
    delayMinutes: 15,
    alternative: 'Route via A1 Highway'
  };

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
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: colors.background }]}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#F59E0B' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[styles.logoutButton, { backgroundColor: colors.background }]}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

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


        {/* Performance Summary Card  */}
        <TouchableOpacity
          style={[styles.performanceCard, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('DriverProfile')}
        >
          <View style={styles.perfHeader}>
            <Text style={styles.perfTitle}>📊 Performance</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </View>
          <View style={styles.perfContent}>
            {/* Safety Score */}
            <View style={styles.riskScoreContainer}>
              <Text style={[styles.riskScore, { color: safetyScore >= 60 ? '#22C55E' : safetyScore >= 40 ? '#F59E0B' : '#EF4444' }]}>
                {loading ? '--' : Math.round(safetyScore)}
              </Text>
              <Text style={styles.scoreLabel}>Safety Score</Text>
            </View>
            <View style={styles.perfDivider} />
            {/* Per-type breakdown from Firebase */}
            <View style={styles.perfStats}>
              <View style={styles.perfStatItem}>
                <Text style={[styles.perfStatValue, { color: speedingCount > 0 ? '#EF4444' : '#22C55E' }]}>
                  {speedingCount}
                </Text>
                <Text style={styles.perfStatLabel}>Speeding</Text>
              </View>
              <View style={styles.perfStatItem}>
                <Text style={[styles.perfStatValue, { color: harshAccelCount > 0 ? '#F59E0B' : '#22C55E' }]}>
                  {harshAccelCount}
                </Text>
                <Text style={styles.perfStatLabel}>Harsh Accel</Text>
              </View>
              <View style={styles.perfStatItem}>
                <Text style={[styles.perfStatValue, { color: suddenBrakeCount > 0 ? '#8B5CF6' : '#22C55E' }]}>
                  {suddenBrakeCount}
                </Text>
                <Text style={styles.perfStatLabel}>Hard Brake</Text>
              </View>
            </View>
          </View>
          {/* Total violations footnote */}
          <Text style={[styles.perfFootnote, { color: colors.textLight }]}>
            {loading ? 'Loading live data...' : `${totalViolations} total violations · tap for full report`}
          </Text>
        </TouchableOpacity>

        {/* Rewards Highlight Card */}
        <TouchableOpacity
          style={[styles.rewardsCard, { backgroundColor: '#8B5CF6' }]}
          onPress={() => navigation.navigate('DriverRewards')}
        >
          <View style={styles.rewardsHeader}>
            <View>
              <Text style={styles.rewardsTitle}>🏆 Your Rewards</Text>
              <Text style={styles.rewardsTier}>
                {loading ? 'Loading...' : `${currentTier} Tier Driver`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </View>
          <View style={styles.rewardsStats}>
            <View style={styles.rewardStat}>
              <Ionicons name="star" size={20} color="#FFF" />
              <Text style={styles.rewardStatValue}>{pointsEarned}</Text>
              <Text style={styles.rewardStatLabel}>Points Earned</Text>
            </View>
            <View style={styles.rewardStat}>
              <Ionicons name="flame" size={20} color="#FFF" />
              <Text style={styles.rewardStatValue}>{daysSafe}</Text>
              <Text style={styles.rewardStatLabel}>Day Streak</Text>
            </View>
            <View style={styles.rewardStat}>
              <Ionicons name="cash" size={20} color="#FFF" />
              <Text style={styles.rewardStatValue}>LKR {monthlyBonus.toLocaleString()}</Text>
              <Text style={styles.rewardStatLabel}>This Month</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Daily Earnings Tracker */}
        {/* <View style={[styles.earningsCard, { backgroundColor: colors.card }]}>
          <View style={styles.earningsHeader}>
            <View>
              <Text style={[styles.earningsTitle, { color: colors.text }]}>💰 Today's Earnings</Text>
              <Text style={styles.earningsAmount}>LKR {todayEarnings.toLocaleString()}</Text>
            </View>
            <View style={styles.earningsTarget}>
              <Text style={styles.targetLabel}>Target</Text>
              <Text style={styles.targetAmount}>LKR {earningsTarget.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${earningsProgress}%`, backgroundColor: earningsProgress >= 100 ? '#22C55E' : '#F59E0B' }]} />
            </View>
            <Text style={styles.progressText}>{earningsProgress}% of target</Text>
          </View>
          <View style={styles.earningsStats}>
            <View style={styles.earningStat}>
              <Text style={styles.earningStatValue}>{tripsToday}</Text>
              <Text style={styles.earningStatLabel}>Trips</Text>
            </View>
            <View style={styles.earningStatDivider} />
            <View style={styles.earningStat}>
              <Text style={styles.earningStatValue}>LKR {avgEarningsPerTrip}</Text>
              <Text style={styles.earningStatLabel}>Avg/Trip</Text>
            </View>
          </View>
        </View> */}

        {/* Emergency Contacts */}
        <View style={[styles.emergencyCard, { backgroundColor: '#EF444410' }]}>
          <Text style={styles.emergencyTitle}>🚨 Emergency Contacts</Text>
          <View style={styles.emergencyButtons}>
            <TouchableOpacity
              style={[styles.emergencyButton, { backgroundColor: '#EF4444' }]}
              onPress={() => Alert.alert('Calling Police', 'Dialing 119...')}
            >
              <Ionicons name="shield" size={24} color="#FFF" />
              <Text style={styles.emergencyButtonText}>Police</Text>
              <Text style={styles.emergencyButtonNumber}>119</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emergencyButton, { backgroundColor: '#DC2626' }]}
              onPress={() => Alert.alert('Calling Ambulance', 'Dialing 1990...')}
            >
              <Ionicons name="medical" size={24} color="#FFF" />
              <Text style={styles.emergencyButtonText}>Ambulance</Text>
              <Text style={styles.emergencyButtonNumber}>1990</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emergencyButton, { backgroundColor: '#F59E0B' }]}
              onPress={() => Alert.alert('Calling Supervisor', 'Dialing supervisor...')}
            >
              <Ionicons name="call" size={24} color="#FFF" />
              <Text style={styles.emergencyButtonText}>Supervisor</Text>
              <Text style={styles.emergencyButtonNumber}>077-XXX</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => Alert.alert('SOS Alert', 'Emergency alert sent to all contacts!')}
          >
            <Ionicons name="warning" size={20} color="#FFF" />
            <Text style={styles.sosButtonText}>🆘 SOS ALERT</Text>
          </TouchableOpacity>
        </View>

        {/* Weather & Route Alerts
        {weatherAlert.hasAlert && (
          <View style={[styles.weatherCard, { backgroundColor: '#FEF3C7' }]}>
            <View style={styles.weatherHeader}>
              <Ionicons name="rainy" size={24} color="#92400E" />
              <Text style={styles.weatherTitle}>🌦️ Weather Alert</Text>
            </View>
            <Text style={styles.weatherCondition}>{weatherAlert.condition} on your route</Text>
            <Text style={styles.weatherRoute}>{weatherAlert.route}</Text>
            <View style={styles.weatherWarnings}>
              {weatherAlert.warnings.map((warning, index) => (
                <View key={index} style={styles.warningItem}>
                  <Ionicons name="alert-circle" size={16} color="#D97706" />
                  <Text style={styles.warningText}>{warning}</Text>
                </View>
              ))}
            </View>
            <View style={styles.weatherFooter}>
              <View style={styles.delayInfo}>
                <Ionicons name="time" size={18} color="#92400E" />
                <Text style={styles.delayText}>+{weatherAlert.delayMinutes} mins delay expected</Text>
              </View>
              <TouchableOpacity style={styles.alternativeButton}>
                <Ionicons name="navigate" size={16} color="#0066CC" />
                <Text style={styles.alternativeText}>{weatherAlert.alternative}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )} */}


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
            {/* <View style={styles.section}>
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
            </View> */}

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
  headerButtons: { flexDirection: 'row', gap: 10 },
  themeButton: { padding: 10, borderRadius: 12 },
  logoutButton: { padding: 10, borderRadius: 12 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  // Performance Card Styles - Compact Design
  performanceCard: { borderRadius: 16, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  perfHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  perfTitle: { fontSize: 16, fontWeight: '700' },
  perfContent: { flexDirection: 'row', alignItems: 'center' },
  riskScoreContainer: { alignItems: 'center', paddingRight: 16 },
  riskScore: { fontSize: 36, fontWeight: 'bold' },
  scoreLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  perfDivider: { width: 1, height: 50, backgroundColor: '#E5E7EB', marginRight: 16 },
  perfStats: { flex: 1, flexDirection: 'row', gap: 8 },
  perfStatItem: { flex: 1, alignItems: 'center' },
  perfStatValue: { fontSize: 20, fontWeight: 'bold' },
  perfStatLabel: { fontSize: 10, color: '#666', marginTop: 3 },
  perfFootnote: { fontSize: 11, marginTop: 10, textAlign: 'center' },
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
  rewardsCard: { borderRadius: 20, padding: 20, marginBottom: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
  rewardsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  rewardsTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  rewardsTier: { fontSize: 14, color: '#FFF', opacity: 0.9, marginTop: 4 },
  rewardsStats: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  rewardStat: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 12 },
  rewardStatValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginTop: 6 },
  rewardStatLabel: { fontSize: 10, color: '#FFF', opacity: 0.9, marginTop: 2 },
  // Earnings Card Styles
  earningsCard: { borderRadius: 20, padding: 20, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  earningsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  earningsAmount: { fontSize: 32, fontWeight: 'bold', color: '#22C55E' },
  earningsTarget: { alignItems: 'flex-end' },
  targetLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  targetAmount: { fontSize: 16, fontWeight: '600', color: '#666' },
  progressBarContainer: { marginBottom: 16 },
  progressBarTrack: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#666', marginTop: 6, textAlign: 'right' },
  earningsStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 },
  earningStat: { flex: 1, alignItems: 'center' },
  earningStatValue: { fontSize: 18, fontWeight: 'bold' },
  earningStatLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  earningStatDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 20 },
  // Emergency Contacts Styles
  emergencyCard: { borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 2, borderColor: '#EF4444' },
  emergencyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#EF4444' },
  emergencyButtons: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  emergencyButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
  emergencyButtonText: { fontSize: 12, fontWeight: '700', color: '#FFF', marginTop: 8 },
  emergencyButtonNumber: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginTop: 4 },
  sosButton: { backgroundColor: '#DC2626', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 4 },
  sosButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  // Weather Alert Styles
  weatherCard: { borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 2, borderColor: '#F59E0B' },
  weatherHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  weatherTitle: { fontSize: 18, fontWeight: 'bold', color: '#92400E' },
  weatherCondition: { fontSize: 16, fontWeight: '600', color: '#92400E', marginBottom: 4 },
  weatherRoute: { fontSize: 14, color: '#78350F', marginBottom: 16 },
  weatherWarnings: { marginBottom: 16 },
  warningItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, backgroundColor: '#FDE68A', padding: 10, borderRadius: 8 },
  warningText: { fontSize: 13, color: '#78350F', flex: 1 },
  weatherFooter: { borderTopWidth: 1, borderTopColor: '#FDE68A', paddingTop: 16 },
  delayInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  delayText: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  alternativeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#0066CC' },
  alternativeText: { fontSize: 13, fontWeight: '600', color: '#0066CC' },
});