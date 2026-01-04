// File: src/screens/user/TripResultScreen.tsx
import React, { useEffect, useRef } from 'react';
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

const { width } = Dimensions.get('window');

export const TripResultScreen = ({ route, navigation }: any) => {
    const { journey, userLocation } = route.params as {
        journey: JourneyResult;
        userLocation: { latitude: number; longitude: number }
    };
    const { colors, isDark } = useTheme();
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        // Fit map to markers
        if (mapRef.current && userLocation && journey) {
            const markers = [
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: journey.route1.closestStop.latitude, longitude: journey.route1.closestStop.longitude },
            ];

            if (journey.type === 'transfer' && journey.route2) {
                // Add transfer stop 
                // Note: We don't have exact coordinates for transfer stop unless we look it up, 
                // but we have the MAIN route's closest stop which is where we get ON the second bus.
                // Actually, for transfer:
                // Route 1 (Feeder): User -> Closest Feeder Stop -> Dropoff (Transfer At)
                // Route 2 (Main): Transfer At -> Main Bus Closest Stop -> Destination

                // Ideally we would plot all these points. For now let's plot User -> Feeder Stop
            }

            mapRef.current.fitToCoordinates(markers, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }, [journey]);

    const getStepIcon = (type: 'walk' | 'bus' | 'transfer') => {
        switch (type) {
            case 'walk': return 'walk-outline';
            case 'bus': return 'bus-outline';
            case 'transfer': return 'swap-horizontal-outline';
        }
    };

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
                        {type === 'direct_far' && (
                            <View style={[styles.warningBox, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
                                <Text style={{ color: '#DC2626', fontSize: 12 }}>
                                    Warning: Stop is {'>'} 1km away.
                                </Text>
                            </View>
                        )}
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
                    userLocation
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

                <View style={styles.stepsContainer}>
                    <Text style={[styles.sectionHeader, { color: colors.textLight }]}>ITINERARY</Text>
                    {journey.type === 'transfer' ? renderTransferRoute() : renderDirectRoute()}
                </View>

                {/* Footer Spacer */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Action Button */}
            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.startBtnText}>Start Journey</Text>
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
        marginBottom: 20,
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
    warningBox: {
        marginTop: 8,
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
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
