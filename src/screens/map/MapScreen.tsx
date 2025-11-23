// File: src/screens/map/MapScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { MAP_CONFIG } from '../../constants/config';

const DUMMY_BUSES = [
  {
    id: '1',
    routeNumber: '138',
    destination: 'Colombo Fort',
    from: 'Negombo Bus Stand',
    arrivalTime: '5 min',
    occupancy: 45,
    status: 'On time',
    location: { latitude: 7.2906, longitude: 79.8570 },
  },
  {
    id: '2',
    routeNumber: '240',
    destination: 'Pettah',
    from: 'Katunayake',
    arrivalTime: '12 min',
    occupancy: 68,
    status: 'On time',
    location: { latitude: 7.2926, longitude: 79.8590 },
  },
  {
    id: '3',
    routeNumber: '03',
    destination: 'Maharagama',
    from: 'Grand Hotel',
    arrivalTime: '20 min',
    occupancy: 85,
    status: 'Delayed',
    location: { latitude: 7.2886, longitude: 79.8550 },
  },
];

export const MapScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const getOccupancyColor = (occ: number) => {
    if (occ < 50) return '#22C55E';
    if (occ <= 75) return '#F59E0B';
    return '#EF4444';
  };

  const handleMarkerPress = (bus: any) => {
    setSelectedBus(bus);
    setShowModal(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={MAP_CONFIG.initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <UrlTile urlTemplate={MAP_CONFIG.osmTileUrl} maximumZ={19} flipY={false} />

        {DUMMY_BUSES.map((bus) => (
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
      </MapView>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Live Bus Tracking
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
          <Text style={[styles.legendText, { color: colors.textLight }]}>50–75%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendText, { color: colors.textLight }]}>&gt;75%</Text>
        </View>
      </View>

      {/* My Location Button */}
      <TouchableOpacity style={[styles.locationBtn, { backgroundColor: colors.card }]}>
        <Ionicons name="locate" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Bus Detail Modal */}
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
                      {selectedBus.arrivalTime}
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
                    navigation.navigate('BusDetails', { bus: selectedBus });
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
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  filterBtn: {
    padding: 4,
  },
  legend: {
    position: 'absolute',
    top: 120,
    right: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationBtn: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  marker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRouteNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  modalInfo: {
    flex: 1,
    marginLeft: 14,
  },
  modalDestination: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalFrom: {
    fontSize: 14,
    marginTop: 2,
  },
  modalStats: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  detailsBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 8,
  },
});