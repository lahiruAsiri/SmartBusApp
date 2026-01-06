// src/screens/driver/DriverLeaderboardScreen.tsx
// Leaderboard screen showing top drivers and current user's rank

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
import { TierBadge } from '../../components/rewards/TierBadge';
import { getLeaderboard, LeaderboardEntry } from '../../services/rewardService';
import { getTierInfo } from '../../utils/rewardCalculations';

export const DriverLeaderboardScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('monthly');

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentUser = leaderboard.find(entry => entry.isCurrentUser);
  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#9CA3AF';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return 'trophy';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'ribbon';
    return 'star-outline';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <Text style={styles.headerSubtitle}>Top performing drivers</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        <TouchableOpacity
          style={[styles.periodTab, period === 'weekly' && styles.activePeriod]}
          onPress={() => setPeriod('weekly')}
        >
          <Text style={[styles.periodText, period === 'weekly' && styles.activePeriodText]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodTab, period === 'monthly' && styles.activePeriod]}
          onPress={() => setPeriod('monthly')}
        >
          <Text style={[styles.periodText, period === 'monthly' && styles.activePeriodText]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodTab, period === 'alltime' && styles.activePeriod]}
          onPress={() => setPeriod('alltime')}
        >
          <Text style={[styles.periodText, period === 'alltime' && styles.activePeriodText]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Top 3 Podium */}
          <View style={styles.podiumContainer}>
            {topThree.length >= 2 && (
              <View style={styles.podiumItem}>
                <View style={[styles.podiumRank, { backgroundColor: getRankColor(2) }]}>
                  <Ionicons name={getRankIcon(2) as any} size={24} color="#FFF" />
                </View>
                <View style={styles.podiumAvatar}>
                  <Text style={styles.podiumAvatarText}>
                    {topThree[1].name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {topThree[1].name}
                </Text>
                <Text style={styles.podiumScore}>{topThree[1].safetyScore}</Text>
                <View style={[styles.podiumBar, { height: 80, backgroundColor: getRankColor(2) }]} />
              </View>
            )}

            {topThree.length >= 1 && (
              <View style={styles.podiumItem}>
                <View style={[styles.podiumRank, { backgroundColor: getRankColor(1) }]}>
                  <Ionicons name={getRankIcon(1) as any} size={28} color="#FFF" />
                </View>
                <View style={[styles.podiumAvatar, styles.firstPlaceAvatar]}>
                  <Text style={styles.podiumAvatarText}>
                    {topThree[0].name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {topThree[0].name}
                </Text>
                <Text style={styles.podiumScore}>{topThree[0].safetyScore}</Text>
                <View style={[styles.podiumBar, { height: 100, backgroundColor: getRankColor(1) }]} />
              </View>
            )}

            {topThree.length >= 3 && (
              <View style={styles.podiumItem}>
                <View style={[styles.podiumRank, { backgroundColor: getRankColor(3) }]}>
                  <Ionicons name={getRankIcon(3) as any} size={24} color="#FFF" />
                </View>
                <View style={styles.podiumAvatar}>
                  <Text style={styles.podiumAvatarText}>
                    {topThree[2].name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {topThree[2].name}
                </Text>
                <Text style={styles.podiumScore}>{topThree[2].safetyScore}</Text>
                <View style={[styles.podiumBar, { height: 60, backgroundColor: getRankColor(3) }]} />
              </View>
            )}
          </View>

          {/* Current User Card (if not in top 3) */}
          {currentUser && currentUser.rank > 3 && (
            <View style={[styles.currentUserCard, { backgroundColor: colors.primary + '20' }]}>
              <View style={styles.currentUserContent}>
                <View style={styles.currentUserRank}>
                  <Text style={[styles.rankNumber, { color: colors.primary }]}>
                    #{currentUser.rank}
                  </Text>
                </View>
                <View style={styles.currentUserInfo}>
                  <Text style={styles.currentUserName}>You</Text>
                  <Text style={styles.currentUserBus}>{currentUser.busId}</Text>
                </View>
                <View style={styles.currentUserStats}>
                  <Text style={styles.currentUserScore}>{currentUser.safetyScore}</Text>
                  <Text style={styles.currentUserLabel}>Score</Text>
                </View>
                <View style={styles.currentUserStreak}>
                  <Ionicons name="flame" size={16} color="#FF6B35" />
                  <Text style={styles.streakText}>{currentUser.streak}d</Text>
                </View>
              </View>
            </View>
          )}

          {/* Rest of Leaderboard */}
          <View style={[styles.listContainer, { backgroundColor: colors.card }]}>
            <Text style={styles.listTitle}>Rankings</Text>
            {restOfLeaderboard.map((entry) => (
              <View
                key={entry.driverId}
                style={[
                  styles.listItem,
                  entry.isCurrentUser && { backgroundColor: colors.primary + '10' }
                ]}
              >
                <View style={styles.listRank}>
                  <Text style={styles.listRankNumber}>#{entry.rank}</Text>
                </View>
                <View style={styles.listAvatar}>
                  <Text style={styles.listAvatarText}>{entry.name.charAt(0)}</Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, entry.isCurrentUser && styles.currentUserHighlight]}>
                    {entry.name} {entry.isCurrentUser && '(You)'}
                  </Text>
                  <Text style={styles.listBus}>{entry.busId}</Text>
                </View>
                <View style={styles.listStats}>
                  <View style={styles.listScore}>
                    <Text style={styles.listScoreValue}>{entry.safetyScore}</Text>
                    <Text style={styles.listScoreLabel}>Score</Text>
                  </View>
                  <View style={styles.listStreak}>
                    <Ionicons name="flame" size={14} color="#FF6B35" />
                    <Text style={styles.listStreakText}>{entry.streak}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
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
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 10,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  activePeriod: {
    backgroundColor: '#3B82F6',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  activePeriodText: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 15,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  firstPlaceAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  podiumAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  currentUserCard: {
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
    elevation: 2,
  },
  currentUserContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserRank: {
    width: 50,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentUserInfo: {
    flex: 1,
    marginLeft: 10,
  },
  currentUserName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentUserBus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  currentUserStats: {
    alignItems: 'center',
    marginRight: 15,
  },
  currentUserScore: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentUserLabel: {
    fontSize: 10,
    color: '#666',
  },
  currentUserStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
    elevation: 2,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listRank: {
    width: 40,
    alignItems: 'center',
  },
  listRankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentUserHighlight: {
    color: '#3B82F6',
  },
  listBus: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  listStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  listScore: {
    alignItems: 'center',
  },
  listScoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listScoreLabel: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  listStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  listStreakText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
