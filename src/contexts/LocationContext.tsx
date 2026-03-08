import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation, UserLocation } from '../services/locationService';

interface LocationContextType {
    location: UserLocation | null;
    gpsLocation: UserLocation | null;
    manualLocation: UserLocation | null;
    isManualMode: boolean;
    setManualLocation: (loc: UserLocation) => Promise<void>;
    setIsManualMode: (active: boolean) => Promise<void>;
    refreshGPS: () => Promise<void>;
    loading: boolean;
}

const LocationContext = createContext<LocationContextType>({} as LocationContextType);

const STORAGE_KEY_MANUAL_MODE = '@location_manual_mode';
const STORAGE_KEY_MANUAL_LOC = '@location_manual_value';

export const useLocation = () => useContext(LocationContext);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [gpsLocation, setGpsLocation] = useState<UserLocation | null>(null);
    const [manualLocation, setManualLocationState] = useState<UserLocation | null>(null);
    const [isManualMode, setIsManualModeState] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
        refreshGPS();
    }, []);

    const loadSettings = async () => {
        try {
            const mode = await AsyncStorage.getItem(STORAGE_KEY_MANUAL_MODE);
            const loc = await AsyncStorage.getItem(STORAGE_KEY_MANUAL_LOC);

            if (mode === 'true') setIsManualModeState(true);
            if (loc) setManualLocationState(JSON.parse(loc));
        } catch (e) {
            console.error('Failed to load location settings', e);
        } finally {
            setLoading(false);
        }
    };

    const refreshGPS = async () => {
        const loc = await getCurrentLocation();
        if (loc) setGpsLocation(loc);
    };

    const setIsManualMode = async (active: boolean) => {
        setIsManualModeState(active);
        await AsyncStorage.setItem(STORAGE_KEY_MANUAL_MODE, active ? 'true' : 'false');
    };

    const setManualLocation = async (loc: UserLocation) => {
        setManualLocationState(loc);
        await AsyncStorage.setItem(STORAGE_KEY_MANUAL_LOC, JSON.stringify(loc));
    };

    // Determine which location to expose as the "active" one
    const activeLocation = isManualMode ? manualLocation : gpsLocation;

    return (
        <LocationContext.Provider
            value={{
                location: activeLocation,
                gpsLocation,
                manualLocation,
                isManualMode,
                setManualLocation,
                setIsManualMode,
                refreshGPS,
                loading
            }}
        >
            {children}
        </LocationContext.Provider>
    );
};
