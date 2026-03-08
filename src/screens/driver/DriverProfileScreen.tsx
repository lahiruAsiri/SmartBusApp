import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getDriverRewardData, DriverRewardData } from '../../services/rewardService';

// Firebase Realtime Database Imports
import { database } from '../../api/firebase';
import { ref, onValue } from 'firebase/database';

export const DriverProfileScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { userData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [driverViolations, setDriverViolations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [driverStats, setDriverStats] = useState<DriverRewardData | null>(null);

  useEffect(() => {
    // Points to the specific path for Bus_01 violations
    const busViolationsRef = ref(database, 'Bus_01/violations');
    
    // Also fetch the driver's RL safety score
    getDriverRewardData().then(setDriverStats).catch(console.error);

    const unsubscribe = onValue(busViolationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fetched = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          // Converts "YYYY-MM-DD HH:mm:ss" to JS Date
          timestamp: new Date(data[key].dateTime.replace(' ', 'T')), 
        })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setDriverViolations(fetched);
      } else {
        setDriverViolations([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Database Read Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // PERFORMANCE CALCULATIONS
  const speedingCount = driverViolations.filter(v => v.type === 'SPEEDING').length;
  const accelCount = driverViolations.filter(v => v.type === 'HARSH_ACCEL').length;
  const brakingCount = driverViolations.filter(v => v.type === 'HARSH_BRAKE').length;

  const totalViolations = driverViolations.length;
  // Use the RL Safety Score, defaulting to 100 if loading fails. Wait, Safety Score is out of 100 where higher is safer.
  // The UI previously calculated Risk Score where higher meant Danger. Let's flip it or rename the UI to Safety Score.
  const safetyScore = driverStats?.safetyScore ?? 100;

  const violationsOnDate = driverViolations.filter(v => 
    v.timestamp.toDateString() === selectedDate.toDateString()
  );

  // UI HELPERS
  const getRiskColor = () => safetyScore >= 70 ? '#22C55E' : safetyScore >= 40 ? '#F59E0B' : '#EF4444';
  const getRiskMessage = () => {
    if (safetyScore >= 70) return 'Excellent Safe Driver!';
    if (safetyScore >= 40) return 'Caution: Improving required';
    return 'High Risk: Drive carefully';
  };

  const getViolationTitle = (v: any) => {
    switch (v.type) {
      case 'SPEEDING': return `Speeding: ${v.value} km/h`;
      case 'HARSH_ACCEL': return `Harsh Accel: ${Math.abs(v.value).toFixed(2)}g`;
      case 'HARSH_BRAKE': return `Sudden Braking`;
      default: return 'Violation';
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowPicker(false);
    if (date) setSelectedDate(date);
  };

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>My Performance</Text>
        <Text style={styles.subtitle}>Real-time Safety Monitoring</Text>
      </View>

      <View style={styles.content}>
        {/* Profile Card */}
        <View style={[styles.card, styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { borderColor: colors.card, backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>R</Text>
          </View>
          <Text style={[styles.driverName, { color: colors.text }]}>Ridma</Text>
          <Text style={styles.busId}>Bus ID: Bus_01</Text>
        </View>

        {/* Safety Score Card */}
        <View style={[styles.card, { backgroundColor: colors.card, alignItems: 'center' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ML Safety Score</Text>
          <View style={[styles.scoreCircle, { borderColor: getRiskColor(), backgroundColor: `${getRiskColor()}15` }]}>
            <Text style={[styles.scoreValue, { color: getRiskColor() }]}>{safetyScore}</Text>
          </View>
          <Text style={[styles.riskMessage, { color: getRiskColor() }]}>{getRiskMessage()}</Text>
        </View>

        {/* Counts Grid */}
        <View style={styles.countsGrid}>
          {[
            { label: 'Speeding', count: speedingCount, icon: 'speedometer', color: '#FF3B30' },
            { label: 'Harsh Accel', count: accelCount, icon: 'trending-up', color: '#F59E0B' },
            { label: 'Harsh Brake', count: brakingCount, icon: 'remove-circle', color: '#8B5CF6' }
          ].map((item, i) => (
            <View key={i} style={[styles.countBox, { backgroundColor: colors.card }]}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={[styles.countNumber, { color: colors.text }]}>{item.count}</Text>
              <Text style={styles.countLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Date Selector */}
        <TouchableOpacity style={[styles.dateCard, { backgroundColor: colors.card }]} onPress={() => setShowPicker(true)}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15`, marginRight: 15 }]}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {showPicker && <DateTimePicker value={selectedDate} mode="date" onChange={onDateChange} />}

        {/* Daily Log List */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Log</Text>
          {violationsOnDate.length === 0 ? (
            <Text style={styles.emptyText}>No violations on this date. Keep it up!</Text>
          ) : (
            violationsOnDate.map((v) => (
              <View key={v.id} style={styles.violationItem}>
                <View style={styles.violationIconContainer}>
                   <Ionicons 
                      name={v.type === 'SPEEDING' ? 'speedometer' : v.type === 'HARSH_ACCEL' ? 'trending-up' : 'remove-circle'} 
                      size={20} 
                      color="#FF3B30" 
                    />
                </View>
                <View style={styles.violationInfo}>
                  <Text style={[styles.violationTitle, { color: colors.text }]}>{getViolationTitle(v)}</Text>
                  <Text style={styles.violationTime}>{v.timestamp.toLocaleTimeString()}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Map', { violationLocation: { latitude: v.lat, longitude: v.lng }, title: v.type })}>
                  <Text style={{ color: colors.primary, marginTop: 4 }}>View on Map →</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Safety Tips Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 8 }]}>Safety Tips</Text>
          </View>
          <Text style={styles.tipText}>• Maintain a steady speed under 60km/h in urban areas.</Text>
          <Text style={styles.tipText}>• Avoid sudden lane changes to minimize harsh acceleration.</Text>
          <Text style={styles.tipText}>• Start braking early to prevent harsh braking alerts.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  header: { padding: 30, paddingTop: 60, paddingBottom: 60, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#FFF', opacity: 0.9, marginTop: 5, letterSpacing: 0.5 },
  content: { padding: 20, paddingTop: 10 },
  card: { padding: 24, borderRadius: 24, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  profileCard: { marginTop: -40, paddingTop: 50, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: -40, borderWidth: 4 },
  avatarText: { fontSize: 32, color: '#FFF', fontWeight: 'bold' },
  driverName: { fontSize: 24, fontWeight: 'bold', marginTop: 5, textAlign: 'center' },
  busId: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 4, fontWeight: '500' },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 8, justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  scoreValue: { fontSize: 38, fontWeight: '900' },
  riskMessage: { fontSize: 18, fontWeight: '700' },
  countsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  countBox: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 20, marginHorizontal: 6, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  countNumber: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  countLabel: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 2, fontWeight: '600' },
  dateCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  dateText: { fontSize: 16, fontWeight: '700', flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  violationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  violationIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  violationInfo: { flex: 1 },
  violationTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  violationTime: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20, fontSize: 15, fontWeight: '500' },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  tipText: { fontSize: 15, color: '#475569', marginVertical: 6, lineHeight: 22, fontWeight: '500' }
});