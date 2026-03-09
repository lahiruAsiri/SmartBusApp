// File: src/screens/user/TripResultScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { JourneyResult } from '../../services/BusRouteOptimizer';
import { MAP_CONFIG } from '../../constants/config';
import { useAuth } from '../../contexts/AuthContext';
import { Bus, subscribeToAllBuses } from '../../services/busService';

const { width } = Dimensions.get('window');

// Calculate distance for internal nearby tracking
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Meters
};

export const TripResultScreen = ({ route, navigation }: any) => {
    const { journey, userLocation } = route.params as {
        journey: JourneyResult;
        userLocation: { latitude: number; longitude: number }
    };
    const { colors, isDark } = useTheme();
    const mapRef = useRef<MapView>(null);
    const [nearbyBuses, setNearbyBuses] = useState<Bus[]>([]);
    const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
    const [isLoadingBuses, setIsLoadingBuses] = useState(true);

    useEffect(() => {
        // Fit map to markers
        if (mapRef.current && userLocation && journey) {
            const markers = [
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: journey.route1.closestStop.latitude, longitude: journey.route1.closestStop.longitude },
            ];

            mapRef.current.fitToCoordinates(markers, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }, [journey]);

    // REAL-TIME BUS SUBSCRIPTION
    useEffect(() => {
        setIsLoadingBuses(true);
        const unsubscribe = subscribeToAllBuses((buses) => {
            // Filter buses for the specific route suggested
            const routeBuses = buses.filter(b => b.routeNumber === journey.route1.routeNumber);

            // Filter only those buses that are currently BEFORE the closest stop or nearby
            // For simplicity in this demo, we pick the one closest to the user's start stop
            const sorted = routeBuses.sort((a, b) => {
                const distA = getDistance(a.location.latitude, a.location.longitude, journey.route1.closestStop.latitude, journey.route1.closestStop.longitude);
                const distB = getDistance(b.location.latitude, b.location.longitude, journey.route1.closestStop.latitude, journey.route1.closestStop.longitude);
                return distA - distB;
            });

            setNearbyBuses(sorted);
            setSelectedBus(sorted[0] || null);
            setIsLoadingBuses(false);
        });

        return () => unsubscribe();
    }, [journey.route1.routeNumber]);

    const renderDirectRoute = () => {
        const { route1, type } = journey;
        return (
            <View>
                {/* Step 1: Walk */}
                <View style={styles.stepItem}>
                    <View style={styles.stepLeft}>
                        <View style={[styles.stepIconCtx, { backgroundColor: colors.inputBg }]}>
                            <Ionicons name="walk-outline" size={20} color={colors.text} />
                        </View>
                        <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
                    </View>
                    <View style={styles.stepRight}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>Walk to {route1.closestStop.location_name}</Text>
                        <Text style={[styles.stepDesc, { color: colors.textLight }]}>
                            Distance: {Math.round(route1.distanceMeters)}m
                        </Text>
                    </View>
                </View>

                {/* Step 2: Bus */}
                <View style={styles.stepItem}>
                    <View style={styles.stepLeft}>
                        <View style={[styles.stepIconCtx, { backgroundColor: '#22C55E' }]}>
                            <Ionicons name="bus-outline" size={20} color="#FFF" />
                        </View>
                    </View>
                    <View style={styles.stepRight}>
                        <View style={styles.busBadgeRow}>
                            <Text style={[styles.stepTitle, { color: colors.text }]}>Take Bus </Text>
                            <View style={[styles.routeBadge, { backgroundColor: '#22C55E' }]}>
                                <Text style={styles.routeBadgeText}>{route1.routeNumber}</Text>
                            </View>
                        </View>
                        <Text style={[styles.stepDesc, { color: colors.textLight }]}>
                            Towards: {route1.destinationMatch}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderTransferRoute = () => {
        const { route1, route2, transferAt } = journey;
        if (!route2) return null;

        return (
            <View>
                {/* Step 1: Walk to Feeder */}
                <View style={styles.stepItem}>
                    <View style={styles.stepLeft}>
                        <View style={[styles.stepIconCtx, { backgroundColor: colors.inputBg }]}>
                            <Ionicons name="walk-outline" size={20} color={colors.text} />
                        </View>
                        <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
                    </View>
                    <View style={styles.stepRight}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>Walk to {route1.closestStop.location_name}</Text>
                        <Text style={[styles.stepDesc, { color: colors.textLight }]}>
                            Distance: {Math.round(route1.distanceMeters)}m
                        </Text>
                    </View>
                </View>

                {/* Step 2: Feeder Bus */}
                <View style={styles.stepItem}>
                    <View style={styles.stepLeft}>
                        <View style={[styles.stepIconCtx, { backgroundColor: '#F59E0B' }]}>
                            <Ionicons name="bus-outline" size={20} color="#FFF" />
                        </View>
                        <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
                    </View>
                    <View style={styles.stepRight}>
                        <View style={styles.busBadgeRow}>
                            <Text style={[styles.stepTitle, { color: colors.text }]}>Take Bus (Feeder) </Text>
                            <View style={[styles.routeBadge, { backgroundColor: '#F59E0B' }]}>
                                <Text style={styles.routeBadgeText}>{route1.routeNumber}</Text>
                            </View>
                        </View>
                        <Text style={[styles.stepDesc, { color: colors.textLight }]}>
                            Get off at: {transferAt}
                        </Text>
                    </View>
                </View>

                {/* Step 3: Transfer */}
                <View style={styles.stepItem}>
                    <View style={styles.stepLeft}>
                        <View style={[styles.stepIconCtx, { backgroundColor: colors.inputBg }]}>
                            <Ionicons name="swap-horizontal" size={20} color={colors.text} />
                        </View>
                        <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
                    </View>
                    <View style={styles.stepRight}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>Transfer at {transferAt}</Text>
                    </View>
                </View>

                {/* Step 4: Main Bus */}
                <View style={styles.stepItem}>
                    <View style={styles.stepLeft}>
                        <View style={[styles.stepIconCtx, { backgroundColor: '#22C55E' }]}>
                            <Ionicons name="bus-outline" size={20} color="#FFF" />
                        </View>
                    </View>
                    <View style={styles.stepRight}>
                        <View style={styles.busBadgeRow}>
                            <Text style={[styles.stepTitle, { color: colors.text }]}>Take Main Bus </Text>
                            <View style={[styles.routeBadge, { backgroundColor: '#22C55E' }]}>
                                <Text style={styles.routeBadgeText}>{route2.routeNumber}</Text>
                            </View>
                        </View>
                        <Text style={[styles.stepDesc, { color: colors.textLight }]}>
                            Towards: {journey.route1.destinationMatch}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            {/* Mini Map Area */}
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.mapContainer}
                onPress={() => navigation.navigate('TripMap', {
                    journey,
                    userLocation,
                    suggestedBus: selectedBus
                })}
            >
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={{
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pointerEvents="none"
                >
                    <UrlTile urlTemplate={MAP_CONFIG.osmTileUrl} maximumZ={19} flipY={false} />

                    {/* Start Marker */}
                    <Marker coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}>
                        <View style={styles.myLocationMarker}>
                            <View style={styles.myLocationDot} />
                        </View>
                    </Marker>

                    {/* Bus Stop Marker */}
                    <Marker coordinate={{
                        latitude: journey.route1.closestStop.latitude,
                        longitude: journey.route1.closestStop.longitude
                    }}>
                        <View style={[styles.stopMarker, { backgroundColor: colors.primary }]}>
                            <Ionicons name="bus" size={14} color="#FFF" />
                        </View>
                    </Marker>

                    {/* Path Line (Straight for now) */}
                    <Polyline
                        coordinates={[
                            { latitude: userLocation.latitude, longitude: userLocation.longitude },
                            { latitude: journey.route1.closestStop.latitude, longitude: journey.route1.closestStop.longitude }
                        ]}
                        strokeColor={colors.primary}
                        strokeWidth={3}
                        lineDashPattern={[5, 5]}
                    />
                </MapView>

                <View style={styles.mapOverlay} pointerEvents="box-none">
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.expandMapBtn}>
                        <Ionicons name="expand" size={20} color="#FFF" />
                        <Text style={styles.expandText}>Expand Map</Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.headerSection, { backgroundColor: colors.card }]}>
                    <Text style={[styles.tripTitle, { color: colors.text }]}>Trip to {journey.route1.destinationMatch}</Text>
                    <View style={styles.tripSummaryRow}>
                        <View style={styles.summaryItem}>
                            <Ionicons name="time-outline" size={18} color={colors.textLight} />
                            <Text style={[styles.summaryText, { color: colors.text }]}>~25 min</Text>
                        </View>
                        <View style={{ width: 20 }} />
                        <View style={styles.summaryItem}>
                            <MaterialCommunityIcons name="bus-stop" size={18} color={colors.textLight} />
                            <Text style={[styles.summaryText, { color: colors.text }]}>
                                {journey.type === 'transfer' ? '1 Transfer' : 'Direct'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* REAL-TIME BUS INSIGHT CARD */}
                <View style={styles.stepsContainer}>
                    <Text style={[styles.sectionHeader, { color: colors.textLight }]}>LIVE BUS INSIGHT</Text>

                    {isLoadingBuses ? (
                        <View style={[styles.busInsightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={{ color: colors.textLight, fontStyle: 'italic' }}>Finding active buses on this route...</Text>
                        </View>
                    ) : selectedBus ? (
                        <View style={[styles.busInsightCard, { backgroundColor: colors.card, borderColor: '#22C55E' }]}>
                            <View style={styles.insightHeader}>
                                <View style={[styles.busIconCircle, { backgroundColor: '#F0FDF4' }]}>
                                    <MaterialCommunityIcons name="bus-clock" size={18} color="#22C55E" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={[styles.busIdText, { color: colors.text }]}>Route {selectedBus.routeNumber}</Text>
                                    <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '700' }}>ONLINE & MOVING</Text>
                                </View>
                                <View style={[styles.occupancyBadge, {
                                    backgroundColor: selectedBus.occupancy > 80 ? '#FEF2F2' : (selectedBus.occupancy < 50 ? '#F0FDF4' : '#FFFBEB')
                                }]}>
                                    <Text style={{
                                        color: selectedBus.occupancy > 80 ? '#EF4444' : (selectedBus.occupancy < 50 ? '#22C55E' : '#F59E0B'),
                                        fontSize: 10, fontWeight: '800'
                                    }}>
                                        {selectedBus.occupancy}% Crowded
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <View style={styles.insightStats}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Status</Text>
                                    <Text style={[styles.statValue, { color: selectedBus.status === 'On time' ? '#22C55E' : '#F59E0B' }]}>
                                        {selectedBus.status}
                                    </Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Next Stop</Text>
                                    <Text style={[styles.statValue, { color: colors.text }]}>{journey.route1.closestStop.location_name}</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.busInsightCard, { backgroundColor: colors.card, borderColor: '#EF4444' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                                <Text style={{ color: '#EF4444', marginLeft: 10, fontWeight: '600' }}>No active buses found on Route {journey.route1.routeNumber}</Text>
                            </View>
                            <Text style={{ color: colors.textLight, fontSize: 12, marginTop: 4 }}>This route might be offline or out of service hours.</Text>
                        </View>
                    )}

                    <Text style={[styles.sectionHeader, { color: colors.textLight, marginTop: 24 }]}>ITINERARY</Text>
                    {journey.type === 'transfer' ? renderTransferRoute() : renderDirectRoute()}
                </View>

                {/* Footer Spacer */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Floating Action Button */}
            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[
                        styles.startBtn,
                        { backgroundColor: selectedBus ? colors.primary : colors.border }
                    ]}
                    disabled={!selectedBus}
                    onPress={() => navigation.navigate('BusDetails', { bus: selectedBus })}
                >
                    <Text style={styles.startBtnText}>
                        {selectedBus ? 'Start Journey' : 'Route Currently Unavailable'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mapContainer: {
        height: 250,
        width: '100%',
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        paddingTop: 50,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    expandMapBtn: {
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    expandText: {
        color: '#FFF',
        marginLeft: 6,
        fontWeight: '600',
        fontSize: 12,
    },
    myLocationMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(33, 150, 243, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    myLocationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2196F3',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    stopMarker: {
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    content: {
        flex: 1,
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    headerSection: {
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    tripTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 10,
    },
    tripSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '500',
    },
    stepsContainer: {
        padding: 24,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 16,
    },
    busInsightCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    busIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    busIdText: {
        fontSize: 15,
        fontWeight: '700',
    },
    occupancyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    insightStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    stepItem: {
        flexDirection: 'row',
        minHeight: 70,
    },
    stepLeft: {
        alignItems: 'center',
        width: 40,
    },
    stepIconCtx: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    stepLine: {
        width: 2,
        flex: 1,
        marginVertical: 4,
    },
    stepRight: {
        flex: 1,
        marginLeft: 16,
        paddingBottom: 24,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 22,
    },
    stepDesc: {
        fontSize: 14,
        marginTop: 4,
    },
    busBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    routeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 6,
    },
    routeBadgeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderTopWidth: 1,
    },
    startBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 16,
    },
    startBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        marginRight: 10,
    },
});
