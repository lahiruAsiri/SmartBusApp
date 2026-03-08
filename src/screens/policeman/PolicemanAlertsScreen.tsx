//police alerts

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { LiveViolations, RealViolation } from './PolicemanHomeScreen';
import { database } from '../../api/firebase';
import { ref, onValue, off } from 'firebase/database';

// ─── Violation type → human label ────────────────────────────────────────────
const violationLabel = (type: string): string => {
  const map: Record<string, string> = {
    SPEEDING:       'Speeding',
    OVER_SPEED:     'Over Speed',
    HARSH_ACCEL:    'Harsh Acceleration',
    HARSH_BRAKE:    'Sudden Brake',
    SUDDEN_BRAKE:   'Sudden Brake',
    LANE_CHANGE:    'Unsafe Lane Change',
  };
  return map[type?.toUpperCase()] ?? type?.replace(/_/g, ' ') ?? 'Violation';
};

// ─── Violation type → icon ────────────────────────────────────────────────────
const violationIcon = (type: string): string => {
  const t = type?.toUpperCase() ?? '';
  if (t.includes('SPEED'))   return 'speedometer';
  if (t.includes('ACCEL'))   return 'flash';
  if (t.includes('BRAKE'))   return 'hand-left';
  return 'alert-circle';
};

// ─── Component ────────────────────────────────────────────────────────────────
export const PolicemanAlertsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [violations, setViolations] = useState<RealViolation[]>(LiveViolations);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Subscribe to live Firebase violations ────────────────────────────────
  useEffect(() => {
    const rootRef = ref(database, '/');

    const unsubscribe = onValue(rootRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      const allViolations: RealViolation[] = [];

      Object.keys(data).forEach((busKey) => {
        if (!busKey.startsWith('Bus_')) return;
        const busData = data[busKey];
        if (!busData?.violations) return;

        Object.keys(busData.violations).forEach((vKey) => {
          const v = busData.violations[vKey];
          if (!v) return;

          // Check if LiveViolations (set by HomeScreen) has proximity info
          const liveMatch = LiveViolations.find(lv => lv.id === `${busKey}_${vKey}`);

          allViolations.push({
            id: `${busKey}_${vKey}`,
            busId: busKey,
            type: v.type || 'UNKNOWN',
            latitude: v.latitude ?? v.lat ?? 6.9271,
            longitude: v.longitude ?? v.lng ?? 79.8612,
            dateTime: v.dateTime || new Date().toISOString(),
            speed: v.speed,
            isNearby: liveMatch?.isNearby ?? false,
            distanceM: liveMatch?.distanceM,
          });
        });
      });

      // Sort: nearby first, then by recency
      allViolations.sort((a, b) => {
        if (a.isNearby && !b.isNearby) return -1;
        if (!a.isNearby && b.isNearby) return 1;
        return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
      });

      setViolations(allViolations);
    });

    return () => off(rootRef);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setViolations([...LiveViolations]);
    setTimeout(() => setRefreshing(false), 600);
  };

  const nearbyCount = violations.filter(v => v.isNearby).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Live Violations</Text>
          <Text style={styles.subtitle}>Firebase Real-Time Feed</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{violations.length}</Text>
        </View>
      </View>

      {/* Nearby banner */}
      {nearbyCount > 0 && (
        <View style={styles.nearbyBanner}>
          <Ionicons name="location" size={18} color="#DC2626" />
          <Text style={styles.nearbyBannerText}>
            {nearbyCount} violation{nearbyCount > 1 ? 's' : ''} within 500m of your location
          </Text>
        </View>
      )}

      {violations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="shield-checkmark" size={80} color="#22C55E" />
          <Text style={[styles.emptyText, { color: colors.text }]}>No violations recorded</Text>
          <Text style={{ color: colors.textLight, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
            Go ON DUTY in the home screen to start real-time monitoring
          </Text>
        </View>
      ) : (
        <FlatList
          data={violations}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                { backgroundColor: colors.card },
                item.isNearby && styles.nearbyCard,
              ]}
              onPress={() =>
                navigation.navigate('Map', {
                  violationLocation: { latitude: item.latitude, longitude: item.longitude },
                  title: `${item.busId} — ${violationLabel(item.type)}`,
                })
              }
            >
              <View style={styles.cardTop}>
                {/* Type icon */}
                <View style={[styles.iconCircle, { backgroundColor: item.isNearby ? '#FEE2E2' : '#F3F4F6' }]}>
                  <Ionicons
                    name={violationIcon(item.type) as any}
                    size={22}
                    color={item.isNearby ? '#DC2626' : '#6B7280'}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.row}>
                    <Text style={[styles.busId, { color: colors.text }]}>{item.busId}</Text>
                    {item.isNearby && (
                      <View style={styles.nearbyBadge}>
                        <Ionicons name="location" size={10} color="#FFF" />
                        <Text style={styles.nearbyBadgeText}>
                          NEARBY {item.distanceM !== undefined ? `· ${item.distanceM}m` : ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.violationType}>{violationLabel(item.type)}</Text>

                  {item.speed !== undefined && (
                    <Text style={styles.speedText}>{item.speed} km/h</Text>
                  )}

                  <Text style={[styles.coordText, { color: colors.textLight }]}>
                    📍 {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                  </Text>

                  <Text style={[styles.timeText, { color: colors.textLight }]}>
                    🕐 {new Date(item.dateTime).toLocaleString()}
                  </Text>
                </View>

                {/* Map arrow */}
                <Ionicons name="map-outline" size={20} color={colors.primary} />
              </View>

              {/* Action row */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: colors.border }]}
                  onPress={() =>
                    navigation.navigate('Map', {
                      violationLocation: { latitude: item.latitude, longitude: item.longitude },
                      title: `${item.busId} — ${violationLabel(item.type)}`,
                    })
                  }
                >
                  <Ionicons name="map" size={14} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>View on Map</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: '#8B5CF6' }]}
                  onPress={() =>
                    navigation.navigate('InvestigationNote', {
                      busId: item.busId,
                      violationType: item.type,
                    })
                  }
                >
                  <Ionicons name="document-text" size={14} color="#8B5CF6" />
                  <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>Log Note</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1 },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title:            { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  subtitle:         { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  countBadge:       { backgroundColor: '#FF3B30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  countText:        { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  nearbyBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FECACA' },
  nearbyBannerText: { color: '#991B1B', fontWeight: '600', fontSize: 13 },
  empty:            { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText:        { fontSize: 18, marginTop: 20, fontWeight: '600' },
  card:             { borderRadius: 16, padding: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
  nearbyCard:       { borderWidth: 2, borderColor: '#EF4444' },
  cardTop:          { flexDirection: 'row', alignItems: 'flex-start' },
  iconCircle:       { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  row:              { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  busId:            { fontSize: 17, fontWeight: 'bold' },
  nearbyBadge:      { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#DC2626', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  nearbyBadgeText:  { color: '#FFF', fontSize: 10, fontWeight: '800' },
  violationType:    { fontSize: 14, fontWeight: '600', color: '#FF3B30', marginTop: 3 },
  speedText:        { fontSize: 15, fontWeight: 'bold', color: '#EF4444', marginTop: 2 },
  coordText:        { fontSize: 12, marginTop: 4 },
  timeText:         { fontSize: 11, marginTop: 3 },
  actionRow:        { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  actionBtnText:    { fontSize: 12, fontWeight: '600' },
});