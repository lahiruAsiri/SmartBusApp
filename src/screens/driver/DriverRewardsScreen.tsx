// src/screens/driver/DriverRewardsScreen.tsx
// Main rewards screen showing tier, points, and available rewards

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TierBadge } from '../../components/rewards/TierBadge';
import { ProgressBar } from '../../components/rewards/ProgressBar';
import {
  getDriverRewardData,
  getAvailableRewards,
  redeemReward,
  DriverRewardData,
  RewardItem,
} from '../../services/rewardService';
import {
  formatCurrency,
  getProgressToNextTier,
  getViolationsToNextTier,
  getTier,
} from '../../utils/rewardCalculations';

export const DriverRewardsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [driverData, setDriverData] = useState<DriverRewardData | null>(null);
  const [availableRewards, setAvailableRewards] = useState<RewardItem[]>([]);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [driver, rewards] = await Promise.all([
        getDriverRewardData(),
        getAvailableRewards(),
      ]);
      setDriverData(driver);
      setAvailableRewards(rewards);
    } catch (error) {
      console.error('Error loading reward data:', error);
      Alert.alert('Error', 'Failed to load rewards data');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: RewardItem) => {
    if (!driverData) return;

    if (driverData.totalPoints < reward.pointsCost) {
      Alert.alert('Insufficient Points', `You need ${reward.pointsCost - driverData.totalPoints} more points to redeem this reward.`);
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Redeem ${reward.title} for ${reward.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            setRedeeming(reward.id);
            try {
              await redeemReward(reward.id, reward.pointsCost);
              Alert.alert('Success!', `${reward.title} has been redeemed. Check your email for details.`);
              loadData(); // Refresh data
            } catch (error) {
              Alert.alert('Error', 'Failed to redeem reward');
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  };

  if (loading || !driverData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  const progressToNext = getProgressToNextTier(driverData.safetyScore);
  const violationsToNext = getViolationsToNextTier(driverData.safetyScore, driverData.totalTrips);
  const nextTier = getTier(driverData.safetyScore - 1);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Rewards</Text>
          <Text style={styles.headerSubtitle}>Earn points for safe driving</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* Current Tier Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={styles.sectionTitle}>Current Tier</Text>
          <TierBadge tier={driverData.currentTier} size="large" />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{driverData.safetyScore}</Text>
              <Text style={styles.statLabel}>Safety Score</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#22C55E' }]}>
                {formatCurrency(driverData.currentMonthBonus)}
              </Text>
              <Text style={styles.statLabel}>Monthly Bonus</Text>
            </View>
          </View>
        </View>

        {/* Points Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.pointsHeader}>
            <View>
              <Text style={styles.sectionTitle}>Available Points</Text>
              <View style={styles.pointsRow}>
                <Ionicons name="star" size={32} color="#F59E0B" />
                <Text style={styles.pointsValue}>{driverData.totalPoints}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.historyButton}
              onPress={() => navigation.navigate('DriverProfile')}
            >
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={[styles.historyText, { color: colors.primary }]}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress to Next Tier */}
        {driverData.currentTier !== 'Platinum' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={styles.sectionTitle}>Progress to {nextTier}</Text>
            <ProgressBar 
              progress={progressToNext}
              color="#3B82F6"
              height={12}
              label={`${Math.round(progressToNext)}% to next tier`}
            />
            <Text style={styles.progressHint}>
              {violationsToNext === 0 
                ? "You're almost there! Keep up the great work!" 
                : `Reduce ${violationsToNext} more violation${violationsToNext > 1 ? 's' : ''} to reach ${nextTier} tier`}
            </Text>
          </View>
        )}

        {/* Streak Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={40} color="#FF6B35" />
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>{driverData.currentStreak} Days</Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
          </View>
          <Text style={styles.streakSubtext}>
            Longest streak: {driverData.longestStreak} days
          </Text>
        </View>

        {/* Available Rewards */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Rewards</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DriverAchievements')}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                View Achievements →
              </Text>
            </TouchableOpacity>
          </View>

          {availableRewards.map((reward) => (
            <View key={reward.id} style={styles.rewardItem}>
              <View style={styles.rewardIcon}>
                <Ionicons name={reward.icon as any} size={28} color={colors.primary} />
              </View>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardDesc}>{reward.description}</Text>
                <View style={styles.rewardCost}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.costText}>{reward.pointsCost} points</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.redeemButton,
                  (!reward.available || driverData.totalPoints < reward.pointsCost) && styles.disabledButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={() => handleRedeem(reward)}
                disabled={!reward.available || driverData.totalPoints < reward.pointsCost || redeeming === reward.id}
              >
                {redeeming === reward.id ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.redeemText}>
                    {!reward.available ? 'Unavailable' : driverData.totalPoints < reward.pointsCost ? 'Locked' : 'Redeem'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('DriverLeaderboard')}
          >
            <Ionicons name="trophy" size={32} color="#F59E0B" />
            <Text style={styles.actionText}>Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('DriverAchievements')}
          >
            <Ionicons name="ribbon" size={32} color="#8B5CF6" />
            <Text style={styles.actionText}>Achievements</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  content: { padding: 15 },
  card: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#666' },
  divider: { width: 1, backgroundColor: '#E5E7EB' },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  pointsValue: { fontSize: 36, fontWeight: 'bold' },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  historyText: { fontSize: 13, fontWeight: '600' },
  progressHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  streakInfo: {},
  streakValue: { fontSize: 28, fontWeight: 'bold' },
  streakLabel: { fontSize: 13, color: '#666', marginTop: 2 },
  streakSubtext: { fontSize: 12, color: '#999', marginTop: 10 },
  section: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: { fontSize: 13, fontWeight: '600' },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rewardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardInfo: { flex: 1 },
  rewardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  rewardDesc: { fontSize: 12, color: '#666', marginBottom: 6 },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costText: { fontSize: 12, fontWeight: 'bold', color: '#92400E' },
  redeemButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  redeemText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
});
