// src/components/rewards/AchievementCard.tsx
// Card component for displaying achievements

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '../../services/rewardService';
import { ProgressBar } from './ProgressBar';

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const isLocked = !achievement.unlocked;
  const hasProgress = achievement.progress !== undefined && achievement.target !== undefined;
  
  return (
    <View style={[styles.card, isLocked && styles.lockedCard]}>
      <View style={[styles.iconContainer, isLocked && styles.lockedIcon]}>
        <Ionicons 
          name={achievement.icon as any} 
          size={32} 
          color={isLocked ? '#9CA3AF' : '#22C55E'} 
        />
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, isLocked && styles.lockedText]}>
            {achievement.title}
          </Text>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.points}>
              {achievement.points}
              {achievement.maxPoints !== undefined ? `/${achievement.maxPoints}` : ''}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.description, isLocked && styles.lockedText]}>
          {achievement.description}
        </Text>
        
        {achievement.unlocked && achievement.unlockedDate && (
          <Text style={styles.unlockedDate}>
            Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
          </Text>
        )}
        
        {hasProgress && (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={(achievement.progress! / achievement.target!) * 100}
              color={achievement.unlocked ? '#22C55E' : '#3B82F6'}
              height={6}
              showPercentage={false}
            />
            <Text style={styles.progressText}>
              {achievement.progress} / {achievement.target}
              {achievement.unlocked ? ' — keep it up! ✅' : ''}
            </Text>
          </View>
        )}
        
        {isLocked && !hasProgress && (
          <View style={styles.lockedBadge}>
            <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
            <Text style={styles.lockedLabel}>Locked</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  lockedCard: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lockedIcon: {
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  lockedText: {
    color: '#9CA3AF',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  points: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  unlockedDate: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lockedLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
