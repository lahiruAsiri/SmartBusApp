import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../api/firebase';

export interface SavedAddress {
    id: string;
    label: string; // e.g., "Home", "Work"
    icon: string; // Ionicons name
    location: {
        latitude: number;
        longitude: number;
        addressString?: string;
    };
    isFavorite: boolean;
    createdAt?: any;
}

export const subscribeToAddresses = (userId: string, onUpdate: (addresses: SavedAddress[]) => void) => {
    if (!userId) return () => { };

    const addressesRef = collection(db, 'users', userId, 'addresses');
    const q = query(addressesRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const addresses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as SavedAddress[];
        onUpdate(addresses);
    }, (error) => {
        console.error("Error subscribing to addresses:", error);
    });
};

export const addAddress = async (userId: string, address: Omit<SavedAddress, 'id'>) => {
    try {
        const addressesRef = collection(db, 'users', userId, 'addresses');
        // console.log(`[addressService] Saving address to path: users/${userId}/addresses`);
        // console.log(`[addressService] Data:`, address);
        await addDoc(addressesRef, {
            ...address,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding address:", error);
        throw error;
    }
};

export const deleteAddress = async (userId: string, addressId: string) => {
    try {
        const docRef = doc(db, 'users', userId, 'addresses', addressId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting address:", error);
        throw error;
    }
};

export const updateAddress = async (userId: string, addressId: string, updates: Partial<SavedAddress>) => {
    try {
        const docRef = doc(db, 'users', userId, 'addresses', addressId);
        await updateDoc(docRef, updates);
    } catch (error) {
        console.error("Error updating address:", error);
        throw error;
    }
};

export const toggleAddressFavorite = async (userId: string, addressId: string, currentStatus: boolean) => {
    // If setting to true, ideally we might want to check limit, but let's keep it simple for now
    await updateAddress(userId, addressId, { isFavorite: !currentStatus });
};
