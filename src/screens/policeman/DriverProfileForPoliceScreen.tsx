import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

// Firebase Realtime Database Imports
import { database } from '../../api/firebase';
import { ref, onValue } from 'firebase/database';

export const DriverProfileForPoliceScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { busId } = route.params;

  const [loading, setLoading] = useState(true);
  const [driverViolations, setDriverViolations] = useState<any[]>([]);
  const [driverInfo, setDriverInfo] = useState({
    name: 'Unknown Driver',
    busId: busId || 'N/A',
    licenseNumber: 'N/A',
  });

  useEffect(() => {
    // Fetch violations for the specific bus
    const busViolationsRef = ref(database, `${busId}/violations`);
    
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
        
        // Extract driver info from first violation if available
        if (fetched.length > 0 && fetched[0].driverName) {
          setDriverInfo(prev => ({
            ...prev,
            name: fetched[0].driverName || prev.name,
          }));
        }
      } else {
        setDriverViolations([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Database Read Error:", error);
      setLoading(false);
      Alert.alert('Error', 'Could not load driver data. Please try again.');
    });

    return () => unsubscribe();
  }, [busId]);

  // PERFORMANCE CALCULATIONS
  const speedingCount = driverViolations.filter(v => v.type === 'SPEEDING').length;
  const accelCount = driverViolations.filter(v => v.type === 'HARSH_ACCEL').length;
  const brakingCount = driverViolations.filter(v => v.type === 'HARSH_BRAKE').length;

  const totalViolations = driverViolations.length;
  const totalTrips = 30; // Static baseline
  const riskScore = Math.min(100, Math.round((totalViolations / totalTrips) * 100));

  // Get recent violations (last 10)
  const recentViolations = driverViolations.slice(0, 10);

  // UI HELPERS
  const getRiskColor = () => riskScore < 30 ? '#22C55E' : riskScore < 70 ? '#F59E0B' : '#EF4444';
  const getRiskMessage = () => {
    if (riskScore < 30) return 'Low Risk Driver';
    if (riskScore < 70) return 'Moderate Risk';
    return 'High Risk Driver';
  };

  const getViolationTitle = (v: any) => {
    switch (v.type) {
      case 'SPEEDING': return `Speeding: ${v.value} km/h`;
      case 'HARSH_ACCEL': return `Harsh Accel: ${Math.abs(v.value).toFixed(2)}g`;
      case 'HARSH_BRAKE': return `Sudden Braking`;
      default: return 'Violation';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Driver Profile</Text>
          <Text style={styles.subtitle}>Police Investigation View</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* Driver Info Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.policeHeader}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={styles.policeLabel}>OFFICIAL POLICE VIEW</Text>
          </View>
          
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{driverInfo.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.driverName}>{driverInfo.name}</Text>
          <Text style={styles.busIdText}>Bus ID: {driverInfo.busId}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={18} color="#666" />
            <Text style={styles.infoText}>License: {driverInfo.licenseNumber}</Text>
          </View>
        </View>

        {/* Risk Score Card */}
        <View style={[styles.card, { backgroundColor: colors.card, alignItems: 'center' }]}>
          <Text style={styles.sectionTitle}>Safety Risk Assessment</Text>
          <View style={[styles.scoreCircle, { borderColor: getRiskColor() }]}>
            <Text style={[styles.scoreValue, { color: getRiskColor() }]}>{riskScore}</Text>
          </View>
          <Text style={[styles.riskMessage, { color: getRiskColor() }]}>{getRiskMessage()}</Text>
          <Text style={styles.riskSubtext}>Based on {totalViolations} violations</Text>
        </View>

        {/* Violation Counts Grid */}
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

        {/* Recent Violations List */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={styles.sectionTitle}>Recent Violations ({recentViolations.length})</Text>
          {recentViolations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={60} color="#22C55E" />
              <Text style={styles.emptyText}>No violations recorded</Text>
            </View>
          ) : (
            recentViolations.map((v) => (
              <View key={v.id} style={styles.violationItem}>
                <View style={styles.violationHeader}>
                  <Ionicons 
                    name={v.type === 'SPEEDING' ? 'speedometer' : v.type === 'HARSH_ACCEL' ? 'trending-up' : 'remove-circle'} 
                    size={20} 
                    color="#FF3B30" 
                  />
                  <Text style={styles.violationTitle}>{getViolationTitle(v)}</Text>
                </View>
                <Text style={styles.violationTime}>
                  {v.timestamp.toLocaleDateString()} at {v.timestamp.toLocaleTimeString()}
                </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Map', { 
                    violationLocation: { latitude: v.lat, longitude: v.lng }, 
                    title: v.type 
                  })}
                  style={styles.mapButton}
                >
                  <Ionicons name="location" size={16} color={colors.primary} />
                  <Text style={[styles.mapButtonText, { color: colors.primary }]}>View Location</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Police Actions */}
        <View style={[styles.section, { backgroundColor: colors.card, marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Investigation Actions</Text>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={() => Alert.alert('Flag Driver', 'This feature will be available in the next update.')}
          >
            <Ionicons name="flag" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Flag for Review</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 10 }]}
            onPress={() => Alert.alert('Add Note', 'This feature will be available in the next update.')}
          >
            <Ionicons name="create" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Add Investigation Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 5 },
  headerContent: { flex: 1, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 12, color: '#FFF', opacity: 0.8, marginTop: 4 },
  content: { padding: 15 },
  card: { padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
  policeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15, gap: 8 },
  policeLabel: { fontSize: 12, fontWeight: 'bold', color: '#0066CC', letterSpacing: 1 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#0066CC', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 10 },
  avatarText: { fontSize: 28, color: '#FFF', fontWeight: 'bold' },
  driverName: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  busIdText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 8 },
  infoText: { fontSize: 14, color: '#666' },
  scoreCircle: { width: 110, height: 110, borderRadius: 55, borderWidth: 8, justifyContent: 'center', alignItems: 'center', marginVertical: 15 },
  scoreValue: { fontSize: 36, fontWeight: 'bold' },
  riskMessage: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  riskSubtext: { fontSize: 12, color: '#999' },
  countsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  countBox: { flex: 1, alignItems: 'center', padding: 15, borderRadius: 12, marginHorizontal: 4, elevation: 2 },
  countNumber: { fontSize: 22, fontWeight: 'bold', marginTop: 5 },
  countLabel: { fontSize: 10, color: '#666', textAlign: 'center', marginTop: 2 },
  section: { borderRadius: 15, padding: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 10 },
  violationItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  violationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 },
  violationTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  violationTime: { fontSize: 12, color: '#64748b', marginLeft: 30 },
  mapButton: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 30, gap: 5 },
  mapButtonText: { fontSize: 13, fontWeight: '600' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 10 },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
