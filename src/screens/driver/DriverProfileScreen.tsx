import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ViolationHistory } from '../policeman/PolicemanHomeScreen';

export const DriverProfileScreen = ({ navigation }: any) => { 
  const { colors } = useTheme();
  const { userData } = useAuth();

  // Filter violations for this driver only
  const myViolations = ViolationHistory
    .filter(v => v.busId === userData?.uid)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalViolations = myViolations.length;
  const totalTrips = 30; // Can be dynamic later
  const riskScore = totalViolations === 0 ? 0 : Math.min(100, Math.round((totalViolations / totalTrips) * 100));
  
  const lastViolation = myViolations[0];
  const daysSinceLast = lastViolation 
    ? Math.floor((Date.now() - new Date(lastViolation.timestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 30;

  const getRiskColor = () => {
    if (riskScore < 30) return '#22C55E';
    if (riskScore < 70) return '#F59E0B';
    return '#EF4444';
  };

  const getRiskMessage = () => {
    if (riskScore < 30) return 'Excellent Safe Driver!';
    if (riskScore < 70) return 'Good, but can improve';
    return 'High Risk — Please drive carefully';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>My Performance</Text>
        <Text style={styles.subtitle}>Driving Behavior Summary</Text>
      </View>

      <View style={styles.content}>
        {/* Driver Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData?.displayName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'DR'}
            </Text>
          </View>
          <Text style={styles.driverName}>{userData?.displayName || 'Driver'}</Text>
          <Text style={styles.busId}>Bus ID: {userData?.uid || 'NA-0000'}</Text> {/* Using uid as fallback */}
        </View>

        {/* Risk Score */}
        <View style={[styles.riskCard, { backgroundColor: colors.card }]}>
          <Text style={styles.riskTitle}>Risk Score</Text>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: getRiskColor() }]}>{riskScore}</Text>
          </View>
          <Text style={[styles.riskMessage, { color: getRiskColor() }]}>
            {getRiskMessage()}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Ionicons name="alert-circle" size={32} color="#FF3B30" />
            <Text style={styles.statNumber}>{totalViolations}</Text>
            <Text style={styles.statLabel}>Total Violations</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Ionicons name="shield-checkmark" size={32} color="#22C55E" />
            <Text style={styles.statNumber}>{daysSinceLast}</Text>
            <Text style={styles.statLabel}>Days Since Last</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Ionicons name="speedometer" size={32} color={getRiskColor()} />
            <Text style={styles.statNumber}>{totalTrips}</Text>
            <Text style={styles.statLabel}>Trips Completed</Text>
          </View>
        </View>

        {/* Recent Violations */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={styles.sectionTitle}>Recent Violations</Text>
          {myViolations.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle" size={60} color="#22C55E" />
              <Text style={styles.emptyText}>No violations recorded</Text>
              <Text style={styles.emptySub}>Excellent safe driving!</Text>
            </View>
          ) : (
            myViolations.slice(0, 5).map((v, i) => (
              <View key={i} style={styles.violationItem}>
                <View style={styles.violationHeader}>
                  <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                  <Text style={styles.violationSpeed}>{v.speed} km/h</Text>
                </View>
                <Text style={styles.violationTime}>
                  {new Date(v.timestamp).toLocaleString()}
                </Text>
                <Text style={styles.violationLocation}>
                  Lat: {v.location.latitude.toFixed(4)}, Lng: {v.location.longitude.toFixed(4)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Safety Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
          <Text style={styles.tipsTitle}>Safety Tips</Text>
          <Text style={styles.tip}>• Maintain speed below 50 km/h in urban areas</Text>
          <Text style={styles.tip}>• Avoid sudden acceleration and harsh braking</Text>
          <Text style={styles.tip}>• Keep safe distance from other vehicles</Text>
          <Text style={styles.tip}>• Stay alert and avoid distractions</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 30, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 16, color: '#FFF', opacity: 0.9, marginTop: 8 },
  content: { padding: 20 },
  infoCard: { alignItems: 'center', padding: 20, borderRadius: 20, elevation: 8, marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0066CC', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 36, color: '#FFF', fontWeight: 'bold' },
  driverName: { fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  busId: { fontSize: 16, color: '#666', marginTop: 4 },
  riskCard: { alignItems: 'center', padding: 30, borderRadius: 20, elevation: 8, marginBottom: 20 },
  riskTitle: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
  scoreCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  scoreValue: { fontSize: 64, fontWeight: 'bold' },
  riskMessage: { fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 1, alignItems: 'center', padding: 20, borderRadius: 16, elevation: 6, marginHorizontal: 6 },
  statNumber: { fontSize: 32, fontWeight: 'bold', marginTop: 12 },
  statLabel: { fontSize: 14, color: '#666', marginTop: 8 },
  section: { borderRadius: 20, padding: 20, elevation: 6, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#666', marginTop: 8 },
  violationItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  violationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  violationSpeed: { fontSize: 18, fontWeight: 'bold', color: '#FF3B30' },
  violationTime: { fontSize: 14, color: '#666', marginTop: 4 },
  violationLocation: { fontSize: 12, color: '#888', marginTop: 4 },
  tipsCard: { borderRadius: 20, padding: 20, elevation: 6 },
  tipsTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  tip: { fontSize: 16, marginVertical: 6, lineHeight: 24 },
});