import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../api/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const MyInvestigationNotesScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { userData } = useAuth();
  
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotes = async () => {
    if (!userData?.uid) return;
    
    try {
      const q = query(
        collection(db, 'investigation_notes'),
        where('officerId', '==', userData.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedNotes: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedNotes.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort the list on the client side (Newest first)
      // This avoids requiring a composite Firestore index immediately
      fetchedNotes.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [userData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  const renderNoteCard = ({ item }: { item: any }) => {
    const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
    
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.busInfo}>
            <Ionicons name="bus" size={20} color={colors.primary} />
            <Text style={[styles.busNumber, { color: colors.text }]}>{item.busNumber}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            item.status === 'resolved' ? styles.statusResolved : styles.statusInvestigating
          ]}>
            <Text style={[
              styles.statusText, 
              item.status === 'resolved' ? { color: '#166534' } : { color: '#92400E' }
            ]}>
              {item.status?.toUpperCase() || 'LOGGED'}
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color="#64748b" />
          <Text style={[styles.infoText, { color: colors.text }]}>Driver: {item.driverName}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text style={[styles.infoText, { color: colors.text }]}>Violation: {item.violationType}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="time" size={16} color="#64748b" />
          <Text style={[styles.dateText, { color: '#64748b' }]}>
            {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Location display */}
        {item.location && (
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#EF4444" />
            <Text style={[styles.dateText, { color: '#64748b' }]}>
              {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        {item.ticketImageUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.ticketImageUrl }} style={styles.ticketImage} resizeMode="cover" />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Investigation Notes</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={60} color="#94a3b8" />
          <Text style={[styles.emptyText, { color: colors.text }]}>No investigation notes found.</Text>
          <Text style={styles.emptySubText}>Notes you submit will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 15 },
  emptySubText: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  busInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  busNumber: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusInvestigating: { backgroundColor: '#FEF3C7' },
  statusResolved: { backgroundColor: '#DCFCE7' },
  statusText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 15, fontWeight: '500' },
  dateText: { fontSize: 13, fontWeight: '500' },
  imageContainer: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  ticketImage: { width: '100%', height: 150 },
});
