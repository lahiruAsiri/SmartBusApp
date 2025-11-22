// File: src/screens/user/BusDetailsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export const BusDetailsScreen = ({ route, navigation }: any) => {
  const { bus } = route.params;

  const getOccupancyColor = (occ: number) => {
    if (occ < 50) return '#22C55E';
    if (occ <= 75) return '#F59E0B';
    return '#EF4444';
  };

  const getOccupancyLabel = (occ: number) => {
    if (occ < 50) return 'Available';
    if (occ <= 75) return 'Moderate';
    return 'Crowded';
  };

  const totalSeats = 45;
  const occupied = Math.round((bus.occupancy / 100) * totalSeats);
  const available = totalSeats - occupied;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bus Details</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bus Hero Card */}
        <View style={styles.heroCard}>
          <View
            style={[
              styles.routeBadgeLarge,
              { backgroundColor: getOccupancyColor(bus.occupancy) },
            ]}
          >
            <Text style={styles.routeNumberLarge}>{bus.routeNumber}</Text>
          </View>
          <Text style={styles.destinationLarge}>{bus.destination}</Text>
          <Text style={styles.fromText}>from {bus.from}</Text>

          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.statusValue}>{bus.arrivalTime}</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              <Text style={styles.statusValue}>{bus.status}</Text>
            </View>
          </View>
        </View>

        {/* Occupancy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Real-Time Occupancy</Text>

          <View style={styles.occupancyCard}>
            <View style={styles.occupancyHeader}>
              <View
                style={[
                  styles.occupancyBadge,
                  { backgroundColor: getOccupancyColor(bus.occupancy) + '20' },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-group"
                  size={24}
                  color={getOccupancyColor(bus.occupancy)}
                />
                <Text
                  style={[
                    styles.occupancyPercentText,
                    { color: getOccupancyColor(bus.occupancy) },
                  ]}
                >
                  {bus.occupancy}%
                </Text>
              </View>
              <Text
                style={[
                  styles.occupancyLabel,
                  { color: getOccupancyColor(bus.occupancy) },
                ]}
              >
                {getOccupancyLabel(bus.occupancy)}
              </Text>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${bus.occupancy}%`,
                      backgroundColor: getOccupancyColor(bus.occupancy),
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabelText}>0%</Text>
                <Text style={styles.progressLabelText}>50%</Text>
                <Text style={styles.progressLabelText}>100%</Text>
              </View>
            </View>

            <View style={styles.seatsInfo}>
              <View style={styles.seatItem}>
                <View style={[styles.seatIcon, { backgroundColor: '#E2E8F0' }]}>
                  <MaterialCommunityIcons
                    name="seat"
                    size={20}
                    color={COLORS.textLight}
                  />
                </View>
                <Text style={styles.seatNumber}>{totalSeats}</Text>
                <Text style={styles.seatLabel}>Total</Text>
              </View>

              <View style={styles.seatItem}>
                <View style={[styles.seatIcon, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons
                    name="seat"
                    size={20}
                    color="#EF4444"
                  />
                </View>
                <Text style={styles.seatNumber}>{occupied}</Text>
                <Text style={styles.seatLabel}>Occupied</Text>
              </View>

              <View style={styles.seatItem}>
                <View style={[styles.seatIcon, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialCommunityIcons
                    name="seat"
                    size={20}
                    color="#22C55E"
                  />
                </View>
                <Text style={styles.seatNumber}>{available}</Text>
                <Text style={styles.seatLabel}>Available</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Journey Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Journey Information</Text>

          <View style={styles.journeyCard}>
            <View style={styles.journeyItem}>
              <View style={styles.journeyIconWrap}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.journeyInfo}>
                <Text style={styles.journeyLabel}>Current Location</Text>
                <Text style={styles.journeyValue}>{bus.from}</Text>
              </View>
            </View>

            <View style={styles.journeyLine} />

            <View style={styles.journeyItem}>
              <View style={styles.journeyIconWrap}>
                <Ionicons name="flag" size={20} color="#22C55E" />
              </View>
              <View style={styles.journeyInfo}>
                <Text style={styles.journeyLabel}>Destination</Text>
                <Text style={styles.journeyValue}>{bus.destination}</Text>
              </View>
            </View>

            <View style={styles.journeyLine} />

            <View style={styles.journeyItem}>
              <View style={styles.journeyIconWrap}>
                <Ionicons name="time" size={20} color="#F59E0B" />
              </View>
              <View style={styles.journeyInfo}>
                <Text style={styles.journeyLabel}>Expected Arrival</Text>
                <Text style={styles.journeyValue}>{bus.arrivalTime}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Live Updates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Updates</Text>

          <View style={styles.updatesCard}>
            <View style={styles.updateItem}>
              <View style={styles.updateDot} />
              <View style={styles.updateContent}>
                <Text style={styles.updateText}>
                  Bus departed from {bus.from}
                </Text>
                <Text style={styles.updateTime}>2 min ago</Text>
              </View>
            </View>

            <View style={styles.updateItem}>
              <View style={styles.updateDot} />
              <View style={styles.updateContent}>
                <Text style={styles.updateText}>
                  Occupancy level: {bus.occupancy}%
                </Text>
                <Text style={styles.updateTime}>1 min ago</Text>
              </View>
            </View>

            <View style={styles.updateItem}>
              <View style={[styles.updateDot, { backgroundColor: '#22C55E' }]} />
              <View style={styles.updateContent}>
                <Text style={styles.updateText}>Next stop in 500m</Text>
                <Text style={styles.updateTime}>Just now</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Map', { selectedBus: bus })}
          >
            <Ionicons name="map" size={20} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Track on Map</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryBtnText}>Set Alert</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  shareBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  routeBadgeLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  routeNumberLarge: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  destinationLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  fromText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 6,
  },
  statusDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  occupancyCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  occupancyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  occupancyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  occupancyPercentText: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  occupancyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabelText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  seatsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  seatItem: {
    alignItems: 'center',
  },
  seatIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  seatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  seatLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  journeyCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  journeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyInfo: {
    marginLeft: 14,
  },
  journeyLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  journeyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  journeyLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginLeft: 19,
    marginVertical: 4,
  },
  updatesCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
  },
  updateItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  updateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  updateContent: {
    marginLeft: 12,
    flex: 1,
  },
  updateText: {
    fontSize: 14,
    color: COLORS.text,
  },
  updateTime: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  actions: {
    padding: 16,
    marginBottom: 30,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 8,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
  },
});