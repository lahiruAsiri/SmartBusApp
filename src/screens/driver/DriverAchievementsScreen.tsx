// src/screens/driver/DriverAchievementsScreen.tsx
// Screen displaying all achievements (locked and unlocked)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { AchievementCard } from '../../components/rewards/AchievementCard';
import { getDriverRewardData, DriverRewardData } from '../../services/rewardService';
import { database } from '../../api/firebase';
import { ref, onValue, off } from 'firebase/database';

export const DriverAchievementsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [driverData, setDriverData] = useState<DriverRewardData | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const loadData = async () => {
    try {
      const data = await getDriverRewardData();
      setDriverData(data);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Subscribe to Bus_01/violations — fires immediately AND on every DB change.
    // When the IoT device writes a new violation, achievements auto-recompute.
    const violationsRef = ref(database, 'Bus_01/violations');
    const unsubscribe = onValue(violationsRef, () => {
      loadData();
    });
    return () => off(violationsRef);
  }, []);

  if (loading || !driverData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  const achievements = driverData.achievements;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Achievements</Text>
          <Text style={styles.headerSubtitle}>
            {unlockedCount} / {achievements.length} unlocked
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
        <View style={styles.statBox}>
          <Ionicons name="trophy" size={24} color="#F59E0B" />
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{unlockedCount}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Ionicons name="star" size={24} color="#F59E0B" />
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All ({achievements.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unlocked' && styles.activeTab]}
          onPress={() => setFilter('unlocked')}
        >
          <Text style={[styles.filterText, filter === 'unlocked' && styles.activeFilterText]}>
            Unlocked ({unlockedCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'locked' && styles.activeTab]}
          onPress={() => setFilter('locked')}
        >
          <Text style={[styles.filterText, filter === 'locked' && styles.activeFilterText]}>
            Locked ({achievements.length - unlockedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Achievements List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
        
        {filteredAchievements.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="ribbon-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>No achievements in this category</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: 5 },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 12, color: '#FFF', opacity: 0.8, marginTop: 4 },
  statsBar: {
    flexDirection: 'row',
    padding: 20,
    marginHorizontal: 15,
    marginTop: -15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statInfo: {},
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 15 },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 15,
  },
});
