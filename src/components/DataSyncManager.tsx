import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { syncIoTDataToFirestore } from '../services/dbSyncService';

/**
 * DataSyncManager handles the lifecycle of the IoT data sync.
 * It ensures that syncing only occurs when a user is authenticated,
 * avoiding Firestore permission errors.
 */
export const DataSyncManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    useEffect(() => {
        let unsubscribeSync: (() => void) | undefined;

        if (user) {
            console.log('[DataSyncManager] User authenticated, starting IoT sync...');
            unsubscribeSync = syncIoTDataToFirestore();
        } else {
            console.log('[DataSyncManager] No authenticated user, sync is inactive.');
        }

        return () => {
            if (unsubscribeSync) {
                console.log('[DataSyncManager] Cleaning up IoT sync...');
                unsubscribeSync();
            }
        };
    }, [user]);

    return <>{children}</>;
};
