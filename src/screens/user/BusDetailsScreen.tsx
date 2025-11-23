// File: src/screens/user/BusDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { subscribeToBus } from '../../services/busService';


export const BusDetailsScreen = ({ route, navigation }: any) => {
  const { bus } = route.params;
  const { colors, isDark } = useTheme();
  const [busData, setBusData] = useState(bus);

  useEffect(() => {
    if (!bus.id) return;
    
    const unsubscribe = subscribeToBus(bus.id, (updatedBus) => {
      if (updatedBus) {
        setBusData(updatedBus);
      }
    });
    
  return () => unsubscribe();
}, [bus.id]);

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
  const occupied = Math.round((busData.occupancy / 100) * totalSeats);
  const available = totalSeats - occupied;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>busData Details</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bus Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.routeBadgeLarge,
              { backgroundColor: getOccupancyColor(busData.occupancy) },
            ]}
          >
            <Text style={styles.routeNumberLarge}>{busData.routeNumber}</Text>
          </View>
          <Text style={[styles.destinationLarge, { color: colors.text }]}>
            {busData.destination}
          </Text>
          <Text style={[styles.fromText, { color: colors.textLight }]}>
            from {busData.from}
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {busData.arrivalTime}
              </Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={18} color={busData.status === 'On time' ? '#22C55E' : '#F59E0B'} />
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {busData.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Occupancy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Real-Time Occupancy
          </Text>
          <View style={[styles.occupancyCard, { backgroundColor: colors.card }]}>
            <View style={styles.occupancyHeader}>
              <View
                style={[
                  styles.occupancyBadge,
                  { backgroundColor: getOccupancyColor(busData.occupancy) + '20' },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-group"
                  size={24}
                  color={getOccupancyColor(busData.occupancy)}
                />
                <Text
                  style={[
                    styles.occupancyPercentText,
                    { color: getOccupancyColor(busData.occupancy) },
                  ]}
                >
                  {busData.occupancy}%
                </Text>
              </View>
              <Text
                style={[
                  styles.occupancyLabel,
                  { color: getOccupancyColor(busData.occupancy) },
                ]}
              >
                {getOccupancyLabel(busData.occupancy)}
              </Text>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${busData.occupancy}%`,
                      backgroundColor: getOccupancyColor(busData.occupancy),
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabelText, { color: colors.textLight }]}>0%</Text>
                <Text style={[styles.progressLabelText, { color: colors.textLight }]}>50%</Text>
                <Text style={[styles.progressLabelText, { color: colors.textLight }]}>100%</Text>
              </View>
            </View>

            <View style={styles.seatsInfo}>
              <View style={styles.seatItem}>
                <View style={[styles.seatIcon, { backgroundColor: colors.border }]}>
                  <MaterialCommunityIcons name="seat" size={20} color={colors.textLight} />
                </View>
                <Text style={[styles.seatNumber, { color: colors.text }]}>{totalSeats}</Text>
                <Text style={[styles.seatLabel, { color: colors.textLight }]}>Total</Text>
              </View>
              <View style={styles.seatItem}>
                <View style={[styles.seatIcon, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="seat" size={20} color="#EF4444" />
                </View>
                <Text style={[styles.seatNumber, { color: colors.text }]}>{occupied}</Text>
                <Text style={[styles.seatLabel, { color: colors.textLight }]}>Occupied</Text>
              </View>
              <View style={styles.seatItem}>
                <View style={[styles.seatIcon, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialCommunityIcons name="seat" size={20} color="#22C55E" />
                </View>
                <Text style={[styles.seatNumber, { color: colors.text }]}>{available}</Text>
                <Text style={[styles.seatLabel, { color: colors.textLight }]}>Available</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Journey Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Journey Information
          </Text>
          <View style={[styles.journeyCard, { backgroundColor: colors.card }]}>
            <View style={styles.journeyItem}>
              <View style={[styles.journeyIconWrap, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View style={styles.journeyInfo}>
                <Text style={[styles.journeyLabel, { color: colors.textLight }]}>
                  Current Location
                </Text>
                <Text style={[styles.journeyValue, { color: colors.text }]}>
                  {busData.from}
                </Text>
              </View>
            </View>
            <View style={[styles.journeyLine, { backgroundColor: colors.border }]} />
            <View style={styles.journeyItem}>
              <View style={[styles.journeyIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="flag" size={20} color="#22C55E" />
              </View>
              <View style={styles.journeyInfo}>
                <Text style={[styles.journeyLabel, { color: colors.textLight }]}>
                  Destination
                </Text>
                <Text style={[styles.journeyValue, { color: colors.text }]}>
                  {busData.destination}
                </Text>
              </View>
            </View>
            <View style={[styles.journeyLine, { backgroundColor: colors.border }]} />
            <View style={styles.journeyItem}>
              <View style={[styles.journeyIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time" size={20} color="#F59E0B" />
              </View>
              <View style={styles.journeyInfo}>
                <Text style={[styles.journeyLabel, { color: colors.textLight }]}>
                  Expected Arrival
                </Text>
                <Text style={[styles.journeyValue, { color: colors.text }]}>
                  {busData.arrivalTime}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Live Updates */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Updates</Text>
          <View style={[styles.updatesCard, { backgroundColor: colors.card }]}>
            <View style={styles.updateItem}>
              <View style={[styles.updateDot, { backgroundColor: colors.primary }]} />
              <View style={styles.updateContent}>
                <Text style={[styles.updateText, { color: colors.text }]}>
                  Bus departed from {busData.from}
                </Text>
                <Text style={[styles.updateTime, { color: colors.textLight }]}>2 min ago</Text>
              </View>
            </View>
            <View style={styles.updateItem}>
              <View style={[styles.updateDot, { backgroundColor: colors.primary }]} />
              <View style={styles.updateContent}>
                <Text style={[styles.updateText, { color: colors.text }]}>
                  Occupancy level: {busData.occupancy}%
                </Text>
                <Text style={[styles.updateTime, { color: colors.textLight }]}>1 min ago</Text>
              </View>
            </View>
            <View style={styles.updateItem}>
              <View style={[styles.updateDot, { backgroundColor: '#22C55E' }]} />
              <View style={styles.updateContent}>
                <Text style={[styles.updateText, { color: colors.text }]}>Next stop in 500m</Text>
                <Text style={[styles.updateTime, { color: colors.textLight }]}>Just now</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Map', { selectedBus: bus })}
          >
            <Ionicons name="map" size={20} color="#FFF" />
            <Text style={styles.primaryBtnText}>Track on Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
              },
            ]}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
              Set Alert
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  heroCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
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
    color: '#FFF',
  },
  destinationLarge: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  fromText: {
    fontSize: 14,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '600',
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
    marginHorizontal: 16,
    marginBottom: 12,
  },
  occupancyCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
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
  },
  seatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  journeyCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  journeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  journeyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyInfo: {
    marginLeft: 14,
    flex: 1,
  },
  journeyLabel: {
    fontSize: 12,
  },
  journeyValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  journeyLine: {
    width: 2,
    height: 24,
    marginLeft: 19,
    marginVertical: 4,
  },
  updatesCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  updateItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  updateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  updateContent: {
    marginLeft: 12,
    flex: 1,
  },
  updateText: {
    fontSize: 14,
  },
  updateTime: {
    fontSize: 12,
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
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});