// File: src/screens/user/SavedAddressesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
    SavedAddress,
    subscribeToAddresses,
    deleteAddress,
    toggleAddressFavorite
} from '../../services/addressService';

export const SavedAddressesScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToAddresses(user.uid, (data) => {
            setAddresses(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleDelete = (id: string, label: string) => {
        Alert.alert(
            'Delete Address',
            `Are you sure you want to delete "${label}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (user) await deleteAddress(user.uid, id);
                    }
                }
            ]
        );
    };

    const handleToggleFavorite = async (id: string, currentStatus: boolean) => {
        if (!user) return;
        // Optional: Check limit of favorites
        if (!currentStatus) {
            const favoriteCount = addresses.filter(a => a.isFavorite).length;
            if (favoriteCount >= 2) {
                Alert.alert('Limit Reached', 'You can only have 2 favorite addresses on the home screen.');
                return;
            }
        }
        await toggleAddressFavorite(user.uid, id, currentStatus);
    };

    const renderItem = ({ item }: { item: SavedAddress }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any || 'location'} size={24} color={colors.primary} />
            </View>
            <View style={styles.infoContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.address, { color: colors.textLight }]} numberOfLines={1}>
                    {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
                </Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    onPress={() => handleToggleFavorite(item.id, item.isFavorite)}
                    style={styles.actionBtn}
                >
                    <Ionicons
                        name={item.isFavorite ? "star" : "star-outline"}
                        size={22}
                        color={item.isFavorite ? "#F59E0B" : colors.textLight}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(item.id, item.label)}
                    style={styles.actionBtn}
                >
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Addresses</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={addresses}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="map-outline" size={60} color={colors.border} />
                        <Text style={[styles.emptyText, { color: colors.textLight }]}>No saved addresses yet.</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('AddAddressMap')}
            >
                <Ionicons name="add" size={24} color="#FFF" />
                <Text style={styles.fabText}>Add New</Text>
            </TouchableOpacity>
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
        paddingTop: 50,
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
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoContainer: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    address: {
        fontSize: 14,
        marginTop: 2,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 8,
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
});
