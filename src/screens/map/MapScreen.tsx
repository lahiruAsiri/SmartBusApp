// File: src/screens/map/MapScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView as RNScrollView,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
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
    <View style={mapStyles.container}>
      <MapView
        style={mapStyles.map}
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
                mapStyles.marker,
                { backgroundColor: getOccupancyColor(bus.occupancy) },
              ]}
            >
              <Ionicons name="bus" size={16} color={COLORS.white} />
              <Text style={mapStyles.markerText}>{bus.routeNumber}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View style={mapStyles.header}>
        <TouchableOpacity
          style={mapStyles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={mapStyles.headerTitle}>Live Bus Tracking</Text>
        <TouchableOpacity style={mapStyles.filterBtn}>
          <Ionicons name="filter" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={mapStyles.legend}>
        <View style={mapStyles.legendItem}>
          <View style={[mapStyles.legendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={mapStyles.legendText}>&lt;50%</Text>
        </View>
        <View style={mapStyles.legendItem}>
          <View style={[mapStyles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={mapStyles.legendText}>50-75%</Text>
        </View>
        <View style={mapStyles.legendItem}>
          <View style={[mapStyles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={mapStyles.legendText}>&gt;75%</Text>
        </View>
      </View>

      {/* My Location Button */}
      <TouchableOpacity style={mapStyles.locationBtn}>
        <Ionicons name="locate" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Bus Detail Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={mapStyles.modalContainer}>
          <TouchableOpacity
            style={mapStyles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />

          <View style={mapStyles.modalContent}>
            {selectedBus && (
              <>
                <View style={mapStyles.modalHandle} />

                <View style={mapStyles.modalHeader}>
                  <View
                    style={[
                      mapStyles.modalBadge,
                      { backgroundColor: getOccupancyColor(selectedBus.occupancy) },
                    ]}
                  >
                    <Text style={mapStyles.modalRouteNumber}>
                      {selectedBus.routeNumber}
                    </Text>
                  </View>
                  <View style={mapStyles.modalInfo}>
                    <Text style={mapStyles.modalDestination}>
                      {selectedBus.destination}
                    </Text>
                    <Text style={mapStyles.modalFrom}>from {selectedBus.from}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Ionicons name="close" size={28} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>

                <View style={mapStyles.modalStats}>
                  <View style={mapStyles.statItem}>
                    <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                    <Text style={mapStyles.statValue}>{selectedBus.arrivalTime}</Text>
                    <Text style={mapStyles.statLabel}>Arrival</Text>
                  </View>

                  <View style={mapStyles.statDivider} />

                  <View style={mapStyles.statItem}>
                    <MaterialCommunityIcons
                      name="account-group"
                      size={20}
                      color={getOccupancyColor(selectedBus.occupancy)}
                    />
                    <Text style={mapStyles.statValue}>{selectedBus.occupancy}%</Text>
                    <Text style={mapStyles.statLabel}>Full</Text>
                  </View>

                  <View style={mapStyles.statDivider} />

                  <View style={mapStyles.statItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={selectedBus.status === 'On time' ? '#22C55E' : '#F59E0B'}
                    />
                    <Text style={mapStyles.statValue}>{selectedBus.status}</Text>
                    <Text style={mapStyles.statLabel}>Status</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={mapStyles.detailsBtn}
                  onPress={() => {
                    setShowModal(false);
                    navigation.navigate('BusDetails', { bus: selectedBus });
                  }}
                >
                  <Text style={mapStyles.detailsBtnText}>View Full Details</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const mapStyles = StyleSheet.create({
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
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  filterBtn: {
    padding: 4,
  },
  legend: {
    position: 'absolute',
    top: 120,
    right: 16,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
    color: COLORS.textLight,
  },
  locationBtn: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  marker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  markerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
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
    color: COLORS.white,
  },
  modalInfo: {
    flex: 1,
    marginLeft: 14,
  },
  modalDestination: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalFrom: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  modalStats: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
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
    color: COLORS.text,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  detailsBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginRight: 8,
  },
}); 