import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

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

  useEffect(() => {
    // Points to the specific path for Bus_01 violations
    const busViolationsRef = ref(database, 'Bus_01/violations');
    
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
  const totalTrips = 30; // Static baseline
  // Risk Score: Higher violations = Higher risk
  const riskScore = Math.min(100, Math.round((totalViolations / totalTrips) * 100));

  const violationsOnDate = driverViolations.filter(v => 
    v.timestamp.toDateString() === selectedDate.toDateString()
  );

  // UI HELPERS
  const getRiskColor = () => riskScore < 30 ? '#22C55E' : riskScore < 70 ? '#F59E0B' : '#EF4444';
  const getRiskMessage = () => {
    if (riskScore < 30) return 'Excellent Safe Driver!';
    if (riskScore < 70) return 'Caution: Improving required';
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
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.avatar}><Text style={styles.avatarText}>R</Text></View>
          <Text style={styles.driverName}>Ridma</Text>
          <Text style={styles.busId}>Bus ID: Bus_01</Text>
        </View>

        {/* Risk Score Card */}
        <View style={[styles.card, { backgroundColor: colors.card, alignItems: 'center' }]}>
          <Text style={styles.sectionTitle}>Safety Risk Score</Text>
          <View style={[styles.scoreCircle, { borderColor: getRiskColor() }]}>
            <Text style={[styles.scoreValue, { color: getRiskColor() }]}>{riskScore}</Text>
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
              <Ionicons name={item.icon as any} size={24} color={item.color} />
              <Text style={styles.countNumber}>{item.count}</Text>
              <Text style={styles.countLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Date Selector */}
        <TouchableOpacity style={[styles.dateCard, { backgroundColor: colors.card }]} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar" size={24} color={colors.primary} />
          <Text style={styles.dateText}>{selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        {showPicker && <DateTimePicker value={selectedDate} mode="date" onChange={onDateChange} />}

        {/* Daily Log List */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={styles.sectionTitle}>Daily Log</Text>
          {violationsOnDate.length === 0 ? (
            <Text style={styles.emptyText}>No violations on this date. Keep it up!</Text>
          ) : (
            violationsOnDate.map((v) => (
              <View key={v.id} style={styles.violationItem}>
                <Text style={styles.violationTitle}>{getViolationTitle(v)}</Text>
                <Text style={styles.violationTime}>{v.timestamp.toLocaleTimeString()}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Map', { violationLocation: { latitude: v.lat, longitude: v.lng }, title: v.type })}>
                  <Text style={{ color: colors.primary, marginTop: 4 }}>View on Map →</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Safety Tips Card */}
        <View style={[styles.section, { backgroundColor: colors.card, marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
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
  header: { padding: 30, paddingTop: 50, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#FFF', opacity: 0.8 },
  content: { padding: 15 },
  card: { padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#0066CC', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  avatarText: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  driverName: { fontSize: 20, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  busId: { fontSize: 14, color: '#666', textAlign: 'center' },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, justifyContent: 'center', alignItems: 'center', marginVertical: 15 },
  scoreValue: { fontSize: 32, fontWeight: 'bold' },
  riskMessage: { fontSize: 16, fontWeight: 'bold' },
  countsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  countBox: { flex: 1, alignItems: 'center', padding: 15, borderRadius: 12, marginHorizontal: 4, elevation: 2 },
  countNumber: { fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  countLabel: { fontSize: 10, color: '#666', textAlign: 'center' },
  dateCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 15 },
  dateText: { fontSize: 16, fontWeight: '600', flex: 1, marginLeft: 10 },
  section: { borderRadius: 15, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  violationItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  violationTitle: { fontSize: 15, fontWeight: '600' },
  violationTime: { fontSize: 12, color: '#64748b' },
  emptyText: { textAlign: 'center', color: '#666', paddingVertical: 20 },
  tipText: { fontSize: 14, color: '#444', marginVertical: 4, lineHeight: 20 }
});