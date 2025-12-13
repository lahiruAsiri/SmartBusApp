// src/screens/policeman/BusViolationDetailsScreen.tsx
// POLICE CAN SEE FULL BUS DETAILS + VIOLATION LOCATION

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export const BusViolationDetailsScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { violation } = route.params; // Passed from PolicemanAlertsScreen

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bus Violation Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Bus Info Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={styles.busId}>{violation.busId}</Text>
          <Text style={styles.route}>Route {violation.routeNumber}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="speedometer" size={20} color="#FF3B30" />
            <Text style={styles.speedText}>Speed: {violation.speed} km/h</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.limitText}>Speed Limit Exceeded (50 km/h)</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={20} color="#666" />
            <Text style={styles.locationText}>
              Violation Location:
            </Text>
          </View>
          <Text style={styles.coords}>
            Lat: {violation.location.latitude.toFixed(6)}
          </Text>
          <Text style={styles.coords}>
            Lng: {violation.location.longitude.toFixed(6)}
          </Text>

          <Text style={styles.timestamp}>
            Detected: {violation.timestamp.toLocaleString()}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Map', {
              centerLocation: violation.location,
              highlightedBusId: violation.busId,
            })}
          >
            <Ionicons name="map" size={24} color="#FFF" />
            <Text style={styles.btnText}>View on Map</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]}>
            <Ionicons name="call" size={24} color="#FFF" />
            <Text style={styles.btnText}>Contact Driver</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  content: { flex: 1 },
  card: { margin: 16, padding: 20, borderRadius: 16, elevation: 8 },
  busId: { fontSize: 28, fontWeight: 'bold', color: '#FFF', backgroundColor: '#FF3B30', padding: 12, borderRadius: 12, textAlign: 'center' },
  route: { fontSize: 18, marginTop: 12, textAlign: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 },
  speedText: { fontSize: 20, fontWeight: 'bold', color: '#FF3B30' },
  limitText: { fontSize: 16, color: '#FF3B30' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 },
  locationText: { fontSize: 16, fontWeight: '600' },
  coords: { fontSize: 14, marginLeft: 30, color: '#666' },
  timestamp: { marginTop: 20, fontSize: 14, textAlign: 'center', color: '#666' },
  actions: { padding: 16, gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 10 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});