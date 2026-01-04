// File: src/screens/user/AddAddressMapScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    StatusBar,
    TextInput,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { MAP_CONFIG, getInitialMapRegion } from '../../constants/config';
import { useAuth } from '../../contexts/AuthContext';
import { addAddress } from '../../services/addressService';

const ICONS = ['home', 'briefcase', 'school', 'restaurant', 'heart', 'location'];

export const AddAddressMapScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const mapRef = useRef<MapView>(null);

    const [region, setRegion] = useState(MAP_CONFIG.initialRegion);
    const [label, setLabel] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('home');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const initial = await getInitialMapRegion();
            setRegion(initial);
        })();
    }, []);

    const handleSave = async () => {
        if (!label.trim()) {
            Alert.alert('Required', 'Please enter a name for this location (e.g. Home, Work)');
            return;
        }
        if (!user) return;

        setLoading(true);
        try {
            await addAddress(user.uid, {
                label: label.trim(),
                icon: selectedIcon,
                location: {
                    latitude: region.latitude,
                    longitude: region.longitude
                },
                isFavorite: false, // Default false
            });
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Failed to save address. Please try again.');
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={region}
                onRegionChangeComplete={setRegion}
                rotateEnabled={false}
            >
                <UrlTile urlTemplate={MAP_CONFIG.osmTileUrl} maximumZ={19} flipY={false} />
            </MapView>

            {/* Center Marker */}
            <View style={styles.centerMarkerContainer} pointerEvents="none">
                <Ionicons name="location" size={40} color={colors.primary} style={{ marginBottom: 20 }} />
            </View>

            {/* Top Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pick Location</Text>
            </View>

            {/* Bottom Sheet Form */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.formContainer}
            >
                <View style={[styles.formContent, { backgroundColor: colors.card }]}>
                    <Text style={[styles.label, { color: colors.textLight }]}>Name this location</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
                        placeholder="e.g. Home, Office, Gym"
                        placeholderTextColor={colors.textLight}
                        value={label}
                        onChangeText={setLabel}
                        autoFocus={false}
                    />

                    <Text style={[styles.label, { color: colors.textLight, marginTop: 16 }]}>Select Icon</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconList}>
                        {ICONS.map(icon => (
                            <TouchableOpacity
                                key={icon}
                                style={[
                                    styles.iconItem,
                                    {
                                        backgroundColor: selectedIcon === icon ? colors.primary : colors.inputBg,
                                    }
                                ]}
                                onPress={() => setSelectedIcon(icon)}
                            >
                                <Ionicons
                                    name={icon as any}
                                    size={20}
                                    color={selectedIcon === icon ? '#FFF' : colors.textLight}
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Address'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    centerMarkerContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
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
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 16,
        color: '#000',
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    formContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    formContent: {
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    iconList: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    iconItem: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    saveBtn: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
