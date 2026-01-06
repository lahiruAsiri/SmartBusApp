// File: src/screens/user/TripMapScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { JourneyResult } from '../../services/BusRouteOptimizer';
import { MAP_CONFIG } from '../../constants/config';

export const TripMapScreen = ({ route, navigation }: any) => {
    const { journey, userLocation } = route.params as {
        journey: JourneyResult;
        userLocation: { latitude: number; longitude: number }
    };
    const { colors, isDark } = useTheme();
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        // Fit map to markers with padding
        if (mapRef.current && userLocation && journey) {
            const markers = [
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: journey.route1.closestStop.latitude, longitude: journey.route1.closestStop.longitude },
            ];

            // If transfer, add route2 endpoint or transfer point if possible
            if (journey.type === 'transfer' && journey.route2) {
                // Ideally we add more points to fit
            }

            mapRef.current.fitToCoordinates(markers, {
                edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                animated: true,
            });
        }
    }, [journey]);

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

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
                showsUserLocation={false}
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
                        <Ionicons name="bus" size={16} color="#FFF" />
                    </View>
                </Marker>

                {/* Path Line */}
                <Polyline
                    coordinates={[
                        { latitude: userLocation.latitude, longitude: userLocation.longitude },
                        { latitude: journey.route1.closestStop.latitude, longitude: journey.route1.closestStop.longitude }
                    ]}
                    strokeColor={colors.primary}
                    strokeWidth={4}
                    lineDashPattern={[5, 5]}
                />
            </MapView>

            {/* Header Overlay */}
            <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: colors.card }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={[styles.titleContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.titleText, { color: colors.text }]}>Trip Route</Text>
                </View>
                <View style={{ width: 40 }} />
            </SafeAreaView>

            {/* Legend / Info Overlay */}
            <View style={[styles.infoOverlay, { backgroundColor: colors.card }]}>
                <View style={styles.infoRow}>
                    <View style={styles.myLocationMarkerSmall}>
                        <View style={styles.myLocationDotSmall} />
                    </View>
                    <Text style={[styles.infoText, { color: colors.text }]}>Start</Text>
                </View>
                <View style={{ width: 20 }} />
                <View style={styles.infoRow}>
                    <View style={[styles.stopMarkerSmall, { backgroundColor: colors.primary }]}>
                        <Ionicons name="bus" size={10} color="#FFF" />
                    </View>
                    <Text style={[styles.infoText, { color: colors.text }]}>Bus Stop</Text>
                </View>
            </View>
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
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    titleContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    titleText: {
        fontWeight: '700',
        fontSize: 16,
    },
    myLocationMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(33, 150, 243, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    myLocationDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#2196F3',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    stopMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    infoOverlay: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        marginLeft: 8,
        fontWeight: '600',
        fontSize: 14,
    },
    myLocationMarkerSmall: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(33, 150, 243, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    myLocationDotSmall: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2196F3',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    stopMarkerSmall: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
