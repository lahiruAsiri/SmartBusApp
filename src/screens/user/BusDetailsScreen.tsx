// File: src/screens/user/BusDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { subscribeToBus } from '../../services/busService';
import { useAuth } from '../../contexts/AuthContext';
import { ML_API_URL } from '../../constants/config';


export const BusDetailsScreen = ({ route, navigation }: any) => {
  const { bus } = route.params || {};
  const { colors, isDark } = useTheme();
  const { userData } = useAuth();
  const [busData, setBusData] = useState(bus || {});

  const [aiEtaData, setAiEtaData] = useState<any>(null);
  const [aiCrowdData, setAiCrowdData] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(true);

  useEffect(() => {
    if (!bus?.id || !userData) return;

    const unsubscribe = subscribeToBus(bus.id, (updatedBus) => {
      if (updatedBus && userData) {
        setBusData(updatedBus);
      }
    });

    return () => unsubscribe();
  }, [bus?.id, !!userData]);

  useEffect(() => {
    // Fetch AI predictions when screen mounts
    const fetchAIPredictions = async () => {
      try {
        setIsAiLoading(true);
        // 1. Fetch ETA Prediction
        const etaRes = await fetch(`${ML_API_URL}/predict/eta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route: busData.routeNumber,
            lat: busData.latitude || 6.9,
            lng: busData.longitude || 79.8,
            speed: busData.speed || 15.0,
            hour: new Date().getHours(),
            day_of_week: new Date().getDay(),
            distance_meters: 3500, // mock distance to next major stop
            theoretical_time_seconds: 400
          })
        });
        const etaData = await etaRes.json();
        if (etaData.success) {
          setAiEtaData(etaData);
        }

        // 2. Fetch Crowd Prediction
        const crowdRes = await fetch(`${ML_API_URL}/predict/crowd`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route: busData.routeNumber,
            hour: new Date().getHours() + 1, // predict for next hour
            minute: 0,
            day_of_week: new Date().getDay(),
          })
        });
        const crowdData = await crowdRes.json();
        if (crowdData.success) {
          setAiCrowdData(crowdData);
        }
      } catch (error) {
        console.error('Error fetching AI insights:', error);
      } finally {
        setIsAiLoading(false);
      }
    };

    fetchAIPredictions();
  }, [busData.id, busData.routeNumber]);

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

  const totalSeats = busData.totalSeats || 52;
  const occupied = busData.passengerCount !== undefined ? busData.passengerCount : Math.round((busData.occupancy / 100) * totalSeats);
  const available = totalSeats - occupied;

  const handleRequestStop = async () => {
    try {
      const response = await fetch(
        'https://smart-bus-f38e0-default-rtdb.firebaseio.com/.json',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            buzzer_state: 1,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Stop request sent successfully!');
      } else {
        Alert.alert('Error', 'Failed to send stop request.');
      }
    } catch (error) {
      console.error('Error requesting stop:', error);
      Alert.alert('Error', 'An error occurred while requesting stop.');
    }
  };

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
        </View>

        {/* Occupancy Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
            <MaterialCommunityIcons name="robot" size={20} color="#A855F7" />
            <Text style={[styles.sectionTitle, { color: "#A855F7", marginBottom: 0, marginHorizontal: 6 }]}>
              AI Insights (Research Beta)
            </Text>
          </View>

          <View style={{
            marginHorizontal: 16,
            marginBottom: 20,
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)',
            shadowColor: "#A855F7",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4
          }}>
            {isAiLoading ? (
              <Text style={{ color: colors.textLight, textAlign: 'center', marginVertical: 20 }}>Gathering AI Insights...</Text>
            ) : (
              <>
                {/* ETA Prediction */}
                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : '#F3E8FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="time" size={20} color="#A855F7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: colors.textLight }}>Predictive ETA (XGBoost)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 2 }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
                        {aiEtaData?.is_trained ? `${Math.round(aiEtaData.prediction_seconds / 60)} mins` : "Coming Soon"}
                      </Text>
                      {aiEtaData?.is_trained && aiEtaData.delay_seconds > 0 && (
                        <Text style={{ fontSize: 12, color: '#EF4444', marginLeft: 8, fontWeight: '600' }}>
                          (+{Math.round(aiEtaData.delay_seconds / 60)}m delay likely)
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textLight }}>
                      {aiEtaData?.is_trained ? "Dynamic traffic adjustment applied." : "Analytical data processing in progress."}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : '#F3E8FF', borderRadius: 8, height: 24 }}>
                    <Text style={{ fontSize: 10, color: '#A855F7', fontWeight: 'bold' }}>{aiEtaData?.is_trained ? "95% Conf." : "Beta"}</Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />

                {/* Crowd Forecast */}
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="chart-bell-curve" size={20} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: colors.textLight }}>Crowd Forecast (Next Hour)</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginVertical: 2 }}>
                      {aiCrowdData?.is_trained ? `Expected: ${Math.round(aiCrowdData.prediction)}%` : 'Processing Route...'}
                    </Text>
                    <Text style={{ fontSize: 11, color: aiCrowdData?.is_trained ? (aiCrowdData?.level === 'High' ? '#EF4444' : '#22C55E') : colors.textLight, fontWeight: '600' }}>
                      {aiCrowdData?.is_trained
                        ? (aiCrowdData?.level === 'High' ? 'Recommendation: Delay journey' : 'Recommendation: Good to board')
                        : 'Updated details available soon!'}
                    </Text>
                  </View>
                  {aiCrowdData?.is_trained && (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 30 }}>
                      {/* Mock trend chart based on prediction */}
                      {[
                        aiCrowdData.prediction - 20,
                        aiCrowdData.prediction - 10,
                        aiCrowdData.prediction,
                        aiCrowdData.prediction + 5,
                        aiCrowdData.prediction + 15
                      ].map((h, i) => (
                        <View key={i} style={{
                          width: 6,
                          height: Math.max(5, Math.min(30, h / 3)),
                          backgroundColor: h > 75 ? '#EF4444' : '#22C55E',
                          borderRadius: 3,
                          marginHorizontal: 2
                        }} />
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
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
            onPress={handleRequestStop}
          >
            <Ionicons name="hand-right-outline" size={20} color={colors.primary} />
            <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
              Request Stop
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
    fontSize: 22,
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