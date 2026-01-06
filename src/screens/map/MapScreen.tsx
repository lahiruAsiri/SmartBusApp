// File: src/screens/map/MapScreen.tsx (Updated)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { MAP_CONFIG, getInitialMapRegion } from '../../constants/config';
import { subscribeToAllBuses, Bus } from '../../services/busService';
import { useAuth } from '../../contexts/AuthContext';

export const MapScreen = ({ navigation, route }: any) => {
  const { colors, isDark } = useTheme();
  const { userData } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [mapRegion, setMapRegion] = useState<Region>(MAP_CONFIG.initialRegion);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);

  const violationLocation = route.params?.violationLocation;
  const violationTitle = route.params?.title || 'Live Bus Tracking';

  useEffect(() => {
    const loadUserLocation = async () => {
      setLocationLoading(true);
      const region = await getInitialMapRegion();
      setMapRegion(region);
      setLocationLoading(false);

      // Animate map to user location
      if (mapRef.current && !violationLocation) {
        mapRef.current.animateToRegion(region, 1000);
      }
    };
    loadUserLocation();
  }, []);

  useEffect(() => {
    if (violationLocation && mapRef.current) {
      const region = {
        latitude: violationLocation.latitude,
        longitude: violationLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(region, 1500);
    }
  }, [violationLocation]);

  useEffect(() => {
    if (!userData) return;

    const unsubscribe = subscribeToAllBuses(
      (buses) => {
        setBuses(buses);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading buses:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [!!userData]);

  const getOccupancyColor = (occ: number) => {
    if (occ < 50) return '#22C55E';
    if (occ <= 75) return '#F59E0B';
    return '#EF4444';
  };

  const handleMarkerPress = (bus: any) => {
    setSelectedBus(bus);
    setShowModal(true);
  };

  const handleMyLocation = async () => {
    const region = await getInitialMapRegion();
    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  if (locationLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading your location...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={mapRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <UrlTile urlTemplate={MAP_CONFIG.osmTileUrl} maximumZ={19} flipY={false} />

        {buses.map((bus) => (
          <Marker
            key={bus.id}
            coordinate={bus.location}
            onPress={() => handleMarkerPress(bus)}
          >
            <View
              style={[
                styles.marker,
                { backgroundColor: getOccupancyColor(bus.occupancy) },
              ]}
            >
              <Ionicons name="bus" size={16} color="#FFF" />
              <Text style={styles.markerText}>{bus.routeNumber}</Text>
            </View>
          </Marker>
        ))}

        {violationLocation && (
          <Marker coordinate={violationLocation}>
            <View style={styles.violationMarker}>
              <Ionicons name="warning" size={32} color="#FFF" />
            </View>
            <Text style={styles.violationLabel}>Violation Location</Text>
          </Marker>
        )}
      </MapView>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {violationTitle}
        </Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.card }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={[styles.legendText, { color: colors.textLight }]}>&lt;50%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.legendText, { color: colors.textLight }]}>50-75%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendText, { color: colors.textLight }]}>&gt;75%</Text>
        </View>
      </View>

      {/* My Location Button */}
      <TouchableOpacity
        style={[styles.locationBtn, { backgroundColor: colors.card }]}
        onPress={handleMyLocation}
      >
        <Ionicons name="locate" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Bus Detail Modal - Same as before */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {selectedBus && (
              <>
                <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalBadge,
                      { backgroundColor: getOccupancyColor(selectedBus.occupancy) },
                    ]}
                  >
                    <Text style={styles.modalRouteNumber}>
                      {selectedBus.routeNumber}
                    </Text>
                  </View>
                  <View style={styles.modalInfo}>
                    <Text style={[styles.modalDestination, { color: colors.text }]}>
                      {selectedBus.destination}
                    </Text>
                    <Text style={[styles.modalFrom, { color: colors.textLight }]}>
                      from {selectedBus.from}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Ionicons name="close" size={28} color={colors.textLight} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.modalStats, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {selectedBus.arrivalTime || 'N/A'}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textLight }]}>Arrival</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="account-group"
                      size={20}
                      color={getOccupancyColor(selectedBus.occupancy)}
                    />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {selectedBus.occupancy}%
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textLight }]}>Full</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={selectedBus.status === 'On time' ? '#22C55E' : '#F59E0B'}
                    />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {selectedBus.status}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textLight }]}>Status</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.detailsBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setShowModal(false);
                    const { lastUpdated, ...serializableBus } = selectedBus;
                    navigation.navigate('BusDetails', { bus: serializableBus });
                  }}
                >
                  <Text style={styles.detailsBtnText}>View Full Details</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  map: { ...StyleSheet.absoluteFillObject },
  header: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8, zIndex: 10 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  filterBtn: { padding: 4 },
  legend: { position: 'absolute', top: 120, right: 16, padding: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6, zIndex: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { fontSize: 12, fontWeight: '500' },
  locationBtn: { position: 'absolute', bottom: 30, right: 16, width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8, zIndex: 10 },
  marker: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  markerText: { fontSize: 12, fontWeight: '700', color: '#FFF', marginLeft: 4 },
  violationMarker: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 12 },
  violationLabel: { marginTop: 8, fontSize: 14, fontWeight: 'bold', color: '#EF4444', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  modalRouteNumber: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  modalInfo: { flex: 1, marginLeft: 14 },
  modalDestination: { fontSize: 20, fontWeight: '700' },
  modalFrom: { fontSize: 14, marginTop: 2 },
  modalStats: { flexDirection: 'row', borderRadius: 14, padding: 16, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 40 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14 },
  detailsBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 8,
  },
});