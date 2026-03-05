import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../../contexts/LocationContext';
import { MAP_CONFIG } from '../../constants/config';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export const LocationPickerScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { location, setManualLocation, setIsManualMode } = useLocation();

    // Start with current location or default
    const [pickedLocation, setPickedLocation] = useState(
        location || { latitude: 6.9271, longitude: 79.8612 }
    );

    const handleConfirm = async () => {
        await setManualLocation(pickedLocation);
        await setIsManualMode(true);
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={{
                    ...pickedLocation,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                onPress={(e) => setPickedLocation(e.nativeEvent.coordinate)}
            >
                <UrlTile urlTemplate={MAP_CONFIG.osmTileUrl} maximumZ={19} flipY={false} />
                <Marker
                    coordinate={pickedLocation}
                    draggable
                    onDragEnd={(e) => setPickedLocation(e.nativeEvent.coordinate)}
                />
            </MapView>

            {/* Header Overlays */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.card }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={[styles.titleContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Pick Location</Text>
                </View>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomContainer}>
                <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.infoText, { color: colors.text }]}>
                        Tap on the map or drag the pin to set your custom starting point.
                    </Text>
                    <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                        onPress={handleConfirm}
                    >
                        <Text style={styles.confirmButtonText}>Confirm Location</Text>
                    </TouchableOpacity>
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
        width: width,
        height: height,
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    titleContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
    },
    infoCard: {
        padding: 20,
        borderRadius: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    infoText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    confirmButton: {
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
