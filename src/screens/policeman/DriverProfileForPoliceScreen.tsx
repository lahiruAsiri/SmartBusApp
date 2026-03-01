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
        <View style={[styles.card, styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { borderColor: colors.card, backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{driverInfo.name.charAt(0).toUpperCase()}</Text>
          </View>
          
          <View style={styles.policeHeader}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.policeLabel}>OFFICIAL POLICE VIEW</Text>
          </View>
          
          <Text style={[styles.driverName, { color: colors.text }]}>{driverInfo.name}</Text>
          <Text style={styles.busIdText}>Bus ID: {driverInfo.busId}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={18} color="#64748b" />
            <Text style={styles.infoText}>License: {driverInfo.licenseNumber}</Text>
          </View>
        </View>

        {/* Risk Score Card */}
        <View style={[styles.card, { backgroundColor: colors.card, alignItems: 'center' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Risk Assessment</Text>
          <View style={[styles.scoreCircle, { borderColor: getRiskColor(), backgroundColor: `${getRiskColor()}15` }]}>
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
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={[styles.countNumber, { color: colors.text }]}>{item.count}</Text>
              <Text style={styles.countLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Violations List */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Violations ({recentViolations.length})</Text>
          {recentViolations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={60} color="#22C55E" />
              <Text style={styles.emptyText}>No violations recorded</Text>
            </View>
          ) : (
            recentViolations.map((v) => (
              <View key={v.id} style={styles.violationItem}>
                <View style={styles.violationHeader}>
                  <View style={styles.violationIconContainer}>
                    <Ionicons 
                      name={v.type === 'SPEEDING' ? 'speedometer' : v.type === 'HARSH_ACCEL' ? 'trending-up' : 'remove-circle'} 
                      size={20} 
                      color="#FF3B30" 
                    />
                  </View>
                  <View style={styles.violationInfo}>
                    <Text style={[styles.violationTitle, { color: colors.text }]}>{getViolationTitle(v)}</Text>
                    <Text style={styles.violationTime}>
                      {v.timestamp.toLocaleDateString()} at {v.timestamp.toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
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
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Investigation Actions</Text>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FEF2F2', borderColor: '#EF4444', borderWidth: 1 }]}
            onPress={() => Alert.alert('Flag Driver', 'This feature will be available in the next update.')}
          >
            <Ionicons name="flag" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Flag for Review</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 10 }]}
            onPress={() => navigation.navigate('InvestigationNote', { 
              busId: driverInfo.busId, 
              driverName: driverInfo.name 
            })}
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
  header: { padding: 30, paddingTop: 60, paddingBottom: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { padding: 5 },
  headerContent: { flex: 1, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: '#FFF', opacity: 0.9, marginTop: 5, letterSpacing: 0.5 },
  content: { padding: 20, paddingTop: 10 },
  card: { padding: 24, borderRadius: 24, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  profileCard: { marginTop: -40, paddingTop: 50, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: -40, borderWidth: 4 },
  avatarText: { fontSize: 32, color: '#FFF', fontWeight: 'bold' },
  policeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15, gap: 6, backgroundColor: '#EBF5FF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  policeLabel: { fontSize: 11, fontWeight: '800', color: '#0066CC', letterSpacing: 0.5 },
  driverName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  busIdText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 12, fontWeight: '500' },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4, gap: 8 },
  infoText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 8, justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  scoreValue: { fontSize: 38, fontWeight: '900' },
  riskMessage: { fontSize: 18, fontWeight: '700', marginBottom: 5 },
  riskSubtext: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  countsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  countBox: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 20, marginHorizontal: 6, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  countNumber: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  countLabel: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 2, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 15, color: '#94a3b8', marginTop: 10, fontWeight: '500' },
  violationItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  violationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  violationIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  violationInfo: { flex: 1 },
  violationTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  violationTime: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  mapButton: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 55, gap: 5 },
  mapButtonText: { fontSize: 13, fontWeight: '700' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 10 },
  actionButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
