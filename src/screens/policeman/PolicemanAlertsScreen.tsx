import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { ViolationHistory, addViolation } from './PolicemanHomeScreen';

export const PolicemanAlertsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [violations, setViolations] = useState(ViolationHistory);

  const generateViolation = () => {
    const newViolation = {
      busId: ['NA-1234', 'WP-KA-5678', 'NC-9876', 'SP-4321'][Math.floor(Math.random() * 4)],
      routeNumber: ['138', '177', '100', '154'][Math.floor(Math.random() * 4)],
      speed: 62 + Math.floor(Math.random() * 28),
      location: { latitude: 6.9271 + (Math.random() - 0.5) * 0.1, longitude: 79.8612 + (Math.random() - 0.5) * 0.15 },
      timestamp: new Date().toISOString(),
    };
    addViolation(newViolation);
    setViolations([...ViolationHistory]);
    Vibration.vibrate([0, 800, 200, 800]);
  };

  useEffect(() => {
    const interval = setInterval(generateViolation, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => setViolations(ViolationHistory), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Violation History</Text>
        <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
          <Text style={styles.badgeText}>{violations.length} Total</Text>
        </View>
      </View>

      {violations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="shield-checkmark" size={80} color="#22C55E" />
          <Text style={[styles.emptyText, { color: colors.textLight }]}>No violations yet</Text>
        </View>
      ) : (
        <FlatList
          data={violations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate('Map', { centerLocation: item.location })}
            >
              <View style={styles.row}>
                <Ionicons name="alert-circle" size={28} color="#FF3B30" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.busId, { color: colors.text }]}>{item.busId} | Route {item.routeNumber}</Text>
                  <Text style={styles.speed}>Speed: {item.speed} km/h</Text>
                  <Text style={[styles.location, { color: colors.textLight }]}>
                    Lat: {item.location.latitude.toFixed(6)}, Lng: {item.location.longitude.toFixed(6)}
                  </Text>
                  <Text style={[styles.time, { color: colors.textLight }]}>{item.timestamp.toLocaleString()}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate('BusViolationDetails', { violation: item });
                }}
              >
                <Text style={styles.detailsText}>View Details</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={generateViolation}>
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  badge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  badgeText: { color: '#FFF', fontWeight: 'bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, marginTop: 20 },
  card: { marginHorizontal: 16, marginVertical: 8, padding: 16, borderRadius: 16, elevation: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  busId: { fontSize: 18, fontWeight: 'bold' },
  speed: { fontSize: 19, fontWeight: 'bold', color: '#FF3B30', marginTop: 4 },
  location: { fontSize: 13, marginTop: 8 },
  time: { fontSize: 12, marginTop: 4 },
  detailsBtn: { marginTop: 12, backgroundColor: '#0066CC', padding: 10, borderRadius: 8, alignSelf: 'flex-start' },
  detailsText: { color: '#FFF', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#FF3B30', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 10 },
});