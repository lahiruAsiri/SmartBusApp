//police home 
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Vibration,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { database } from '../../api/firebase';
import { ref, onValue, off } from 'firebase/database';

// ─── Notification Handler ────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Haversine Distance (returns metres between two GPS coords) ──────────────
export const getDistanceMetres = (
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number => {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Shared violation state (for PolicemanAlertsScreen) ──────────────────────
export interface RealViolation {
  id: string;
  busId: string;
  type: string;
  latitude: number;
  longitude: number;
  dateTime: string;
  speed?: number;
  isNearby?: boolean;   // within 500m of officer
  distanceM?: number;
}

export let LiveViolations: RealViolation[] = [];
export const setLiveViolations = (v: RealViolation[]) => { LiveViolations = v; };

// ─── Component ───────────────────────────────────────────────────────────────
export const PolicemanHomeScreen = ({ navigation }: any) => {
  const { colors, toggleTheme, isDark } = useTheme();
  const { userData, logout } = useAuth();

  const [isOnDuty, setIsOnDuty] = useState(false);
  const [officerLocation, setOfficerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [violations, setViolations] = useState<RealViolation[]>([]);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [activeBusCount, setActiveBusCount] = useState(0);

  const locationWatchRef = useRef<any>(null);
  const officerLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const notifiedViolationIds = useRef<Set<string>>(new Set());
  const responseListener = useRef<any>(null);

  // ─── Notification tap handler ─────────────────────────────────────────────
  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.busId) {
        navigation.navigate('PolicemanAlerts');
      }
    });
    return () => responseListener.current?.remove();
  }, []);

  // ─── Firebase: subscribe to ALL bus violations in real-time ──────────────
  useEffect(() => {
    if (!isOnDuty) return;

    const rootRef = ref(database, '/');
    const unsubscribe = onValue(rootRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      const allViolations: RealViolation[] = [];
      let busCount = 0;

      Object.keys(data).forEach((busKey) => {
        if (!busKey.startsWith('Bus_')) return;

        const busData = data[busKey];
        if (!busData) return;

        // Count buses that have live data
        if (busData.live_data) busCount++;

        // Collect violations from this bus
        if (busData.violations) {
          Object.keys(busData.violations).forEach((vKey) => {
            const v = busData.violations[vKey];
            if (!v) return;

            allViolations.push({
              id: `${busKey}_${vKey}`,
              busId: busKey,
              type: v.type || 'UNKNOWN',
              latitude: v.latitude ?? v.lat ?? 6.9271,
              longitude: v.longitude ?? v.lng ?? 79.8612,
              dateTime: v.dateTime || new Date().toISOString(),
              speed: v.speed,
            });
          });
        }
      });

      setActiveBusCount(busCount);

      // Sort by most recent
      allViolations.sort((a, b) =>
        new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      );

      // ─── 500m Proximity Check ─────────────────────────────────────────────
      const loc = officerLocationRef.current;
      const enriched = allViolations.map((v) => {
        if (!loc) return { ...v, isNearby: false, distanceM: undefined };
        const dist = getDistanceMetres(loc.latitude, loc.longitude, v.latitude, v.longitude);
        return { ...v, isNearby: dist <= 500, distanceM: Math.round(dist) };
      });

      // Alert officer for NEW nearby violations only
      enriched.forEach((v) => {
        if (v.isNearby && !notifiedViolationIds.current.has(v.id)) {
          notifiedViolationIds.current.add(v.id);
          triggerProximityAlert(v);
        }
      });

      const nearby = enriched.filter((v) => v.isNearby).length;
      setNearbyCount(nearby);
      setViolations(enriched);
      setLiveViolations(enriched);
    });

    return () => off(rootRef);
  }, [isOnDuty]);

  // ─── GPS: watch officer location while on duty ────────────────────────────
  useEffect(() => {
    if (!isOnDuty) {
      locationWatchRef.current?.remove();
      locationWatchRef.current = null;
      return;
    }

    const startWatch = async () => {
      locationWatchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 20 },
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setOfficerLocation(coords);
          officerLocationRef.current = coords;
        }
      );
    };
    startWatch();

    return () => {
      locationWatchRef.current?.remove();
      locationWatchRef.current = null;
    };
  }, [isOnDuty]);

  // ─── Proximity Alert ──────────────────────────────────────────────────────
  const triggerProximityAlert = async (v: RealViolation) => {
    Vibration.vibrate([0, 400, 100, 400, 100, 800]);

    const typeLabel = v.type.replace(/_/g, ' ');
    const distLabel = v.distanceM !== undefined ? `${v.distanceM}m away` : 'nearby';

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 VIOLATION NEARBY — ${v.busId}`,
          body: `${typeLabel} detected ${distLabel}. Tap to view on map.`,
          data: { busId: v.busId, latitude: v.latitude, longitude: v.longitude },
        },
        trigger: null,
      });
    } catch {
      // Expo Go limitation — vibration still works as fallback
    }
  };

  // ─── Duty toggle ─────────────────────────────────────────────────────────
  const toggleDutyStatus = async (value: boolean) => {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable location to start your duty.');
        return;
      }
      // Get immediate location
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setOfficerLocation(coords);
      officerLocationRef.current = coords;
      notifiedViolationIds.current.clear(); // Reset notified set on new shift
      setIsOnDuty(true);
      Vibration.vibrate(100);
    } else {
      setIsOnDuty(false);
      setOfficerLocation(null);
      officerLocationRef.current = null;
      setViolations([]);
      setNearbyCount(0);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Traffic Police Portal</Text>
          <Text style={styles.officerName}>Officer {userData?.displayName || 'Perera'}</Text>

          <View style={styles.dutyToggleContainer}>
            <Switch
              value={isOnDuty}
              onValueChange={toggleDutyStatus}
              trackColor={{ false: '#767577', true: '#34C759' }}
              thumbColor={isOnDuty ? '#FFF' : '#f4f3f4'}
            />
            <Text style={[styles.dutyText, { color: isOnDuty ? '#34C759' : '#FFD60A' }]}>
              {isOnDuty ? '• ON DUTY' : '• OFF DUTY'}
            </Text>
          </View>

          {/* Live officer GPS display */}
          {isOnDuty && officerLocation && (
            <Text style={styles.gpsText}>
              📍 {officerLocation.latitude.toFixed(5)}, {officerLocation.longitude.toFixed(5)}
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.badgeContainer}>
          <View style={styles.policeBadge}>
            <Ionicons name="shield" size={36} color="#FFF" />
          </View>
          <Text style={styles.badgeText}>SRI LANKA POLICE</Text>
        </View>
      </View>

      <View style={styles.content}>
        {!isOnDuty && (
          <View style={styles.statusBanner}>
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <Text style={styles.statusBannerText}>Switch to ON DUTY to start real-time monitoring</Text>
          </View>
        )}

        {/* Proximity radius indicator */}
        {isOnDuty && nearbyCount > 0 && (
          <View style={[styles.statusBanner, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="warning" size={20} color="#DC2626" />
            <Text style={[styles.statusBannerText, { color: '#991B1B' }]}>
              ⚠️ {nearbyCount} violation{nearbyCount > 1 ? 's' : ''} within 500m of your location!
            </Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#EF444420' }]}>
            <Ionicons name="alert-circle" size={40} color="#EF4444" />
            <Text style={styles.statNumber}>{isOnDuty ? violations.length : 0}</Text>
            <Text style={styles.statLabel}>Total Alerts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FF000030' }]}>
            <Ionicons name="locate" size={40} color="#DC2626" />
            <Text style={styles.statNumber}>{isOnDuty ? nearbyCount : 0}</Text>
            <Text style={styles.statLabel}>Within 500m</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#22C55E20' }]}>
            <Ionicons name="bus" size={40} color="#22C55E" />
            <Text style={styles.statNumber}>{isOnDuty ? activeBusCount : 0}</Text>
            <Text style={styles.statLabel}>Active Buses</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#8B5CF620' }]}>
            <Ionicons name="radio" size={40} color="#8B5CF6" />
            <Text style={styles.statNumber}>{isOnDuty ? '●' : '○'}</Text>
            <Text style={styles.statLabel}>Live Feed</Text>
          </View>
        </View>

        {/* Enforcement Tools */}
        <View style={[styles.toolsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Enforcement Tools</Text>

          <TouchableOpacity
            style={[styles.toolItem, !isOnDuty && { opacity: 0.4 }]}
            onPress={() => isOnDuty ? navigation.navigate('Map') : null}
          >
            <View style={styles.toolLeft}>
              <Ionicons name="map" size={28} color={colors.primary} />
              <View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>Live Tracking Map</Text>
                <Text style={styles.toolDesc}>Real-time bus positions in your sector</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolItem, !isOnDuty && { opacity: 0.4 }]}
            onPress={() => isOnDuty ? navigation.navigate('PolicemanAlerts') : null}
          >
            <View style={styles.toolLeft}>
              <View>
                <Ionicons name="list" size={28} color="#FF3B30" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>Live Violations</Text>
                  {isOnDuty && violations.length > 0 && (
                    <View style={styles.alertBadge}>
                      <Text style={styles.alertBadgeText}>{violations.length}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.toolDesc}>Real Firebase violation log</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolItem} onPress={() => navigation.navigate('InvestigationNote')}>
            <View style={styles.toolLeft}>
              <Ionicons name="document-text" size={28} color="#8B5CF6" />
              <View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>Submit New Note</Text>
                <Text style={styles.toolDesc}>Log a physical fine ticket issued on-site</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolItem} onPress={() => navigation.navigate('MyInvestigationNotes')}>
            <View style={styles.toolLeft}>
              <Ionicons name="folder-open" size={28} color="#0EA5E9" />
              <View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>My Notes Archive</Text>
                <Text style={styles.toolDesc}>View investigation notes you've issued</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert('Emergency', 'Emergency services contacted.')}
            >
              <Ionicons name="call" size={28} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Emergency</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Map')}>
              <Ionicons name="navigate" size={28} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PolicemanAlerts')}>
              <Ionicons name="notifications" size={28} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Alerts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('InvestigationNote')}>
              <Ionicons name="document-text" size={28} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Invest. Note</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>End Shift &amp; Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30, flexDirection: 'row', justifyContent: 'space-between' },
  greeting: { fontSize: 14, color: '#FFF', opacity: 0.8 },
  officerName: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  dutyToggleContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  dutyText: { fontSize: 13, fontWeight: '800' },
  gpsText: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  themeToggleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
  badgeContainer: { alignItems: 'center' },
  policeBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 9, marginTop: 5, textAlign: 'center', fontWeight: 'bold' },
  content: { padding: 20 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginBottom: 16, gap: 10 },
  statusBannerText: { color: '#92400E', fontSize: 13, fontWeight: '600', flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', padding: 15, borderRadius: 16, alignItems: 'center', marginBottom: 15 },
  statNumber: { fontSize: 32, fontWeight: 'bold', marginVertical: 5 },
  statLabel: { fontSize: 12, color: '#666' },
  toolsCard: { borderRadius: 20, padding: 20, marginBottom: 20, elevation: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  toolItem: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  toolLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  toolTitle: { fontSize: 16, fontWeight: '600' },
  toolDesc: { fontSize: 12, color: '#666' },
  alertBadge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  alertBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  actionsCard: { borderRadius: 20, padding: 20, marginBottom: 30, elevation: 4 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', width: '23%' },
  actionText: { fontSize: 10, marginTop: 5, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#EF4444' },
  logoutText: { color: '#EF4444', fontWeight: 'bold', marginLeft: 10 },
});