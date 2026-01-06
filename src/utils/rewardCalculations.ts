// src/utils/rewardCalculations.ts
// Utility functions for reward system calculations

export type TierType = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Standard';

export interface TierInfo {
  name: TierType;
  color: string;
  icon: string;
  monthlyBonus: number;
  minScore: number;
  maxScore: number;
  description: string;
}

// Tier definitions
export const TIER_CONFIG: Record<TierType, TierInfo> = {
  Platinum: {
    name: 'Platinum',
    color: '#FFD700',
    icon: 'trophy',
    monthlyBonus: 5000,
    minScore: 0,
    maxScore: 15,
    description: 'Excellent Driver'
  },
  Gold: {
    name: 'Gold',
    color: '#C0C0C0',
    icon: 'medal',
    monthlyBonus: 3000,
    minScore: 16,
    maxScore: 30,
    description: 'Very Good Driver'
  },
  Silver: {
    name: 'Silver',
    color: '#CD7F32',
    icon: 'ribbon',
    monthlyBonus: 1500,
    minScore: 31,
    maxScore: 50,
    description: 'Good Driver'
  },
  Bronze: {
    name: 'Bronze',
    color: '#3B82F6',
    icon: 'star',
    monthlyBonus: 500,
    minScore: 51,
    maxScore: 70,
    description: 'Fair Driver'
  },
  Standard: {
    name: 'Standard',
    color: '#9CA3AF',
    icon: 'car',
    monthlyBonus: 0,
    minScore: 71,
    maxScore: 100,
    description: 'Needs Improvement'
  }
};

/**
 * Calculate safety score based on violations and trips
 * Lower score = Better performance
 */
export const calculateSafetyScore = (violations: number, trips: number): number => {
  if (trips === 0) return 0;
  return Math.min(100, Math.round((violations / trips) * 100));
};

/**
 * Determine tier based on safety score
 */
export const getTier = (score: number): TierType => {
  if (score <= 15) return 'Platinum';
  if (score <= 30) return 'Gold';
  if (score <= 50) return 'Silver';
  if (score <= 70) return 'Bronze';
  return 'Standard';
};

/**
 * Get tier information
 */
export const getTierInfo = (tier: TierType): TierInfo => {
  return TIER_CONFIG[tier];
};

/**
 * Calculate monthly bonus based on tier
 */
export const getMonthlyBonus = (tier: TierType): number => {
  return TIER_CONFIG[tier].monthlyBonus;
};

/**
 * Calculate progress to next tier (0-100%)
 */
export const getProgressToNextTier = (currentScore: number): number => {
  const currentTier = getTier(currentScore);
  const currentTierInfo = TIER_CONFIG[currentTier];
  
  // If already at Platinum, return 100%
  if (currentTier === 'Platinum') return 100;
  
  // Find next tier
  const tiers: TierType[] = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Standard'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex === 0) return 100;
  
  const nextTier = tiers[currentIndex - 1];
  const nextTierInfo = TIER_CONFIG[nextTier];
  
  // Calculate progress within current tier range
  const rangeSize = currentTierInfo.maxScore - currentTierInfo.minScore;
  const progressInRange = currentScore - currentTierInfo.minScore;
  const percentInRange = (progressInRange / rangeSize) * 100;
  
  // Invert because lower score is better
  return Math.max(0, Math.min(100, 100 - percentInRange));
};

/**
 * Get violations needed to reach next tier
 */
export const getViolationsToNextTier = (
  currentScore: number,
  totalTrips: number
): number => {
  const currentTier = getTier(currentScore);
  if (currentTier === 'Platinum') return 0;
  
  const tiers: TierType[] = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Standard'];
  const currentIndex = tiers.indexOf(currentTier);
  const nextTier = tiers[currentIndex - 1];
  const nextTierInfo = TIER_CONFIG[nextTier];
  
  // Calculate max violations allowed for next tier
  const maxViolationsForNextTier = Math.floor((nextTierInfo.maxScore * totalTrips) / 100);
  const currentViolations = Math.floor((currentScore * totalTrips) / 100);
  
  return Math.max(0, currentViolations - maxViolationsForNextTier);
};

/**
 * Format currency in LKR
 */
export const formatCurrency = (amount: number): string => {
  return `LKR ${amount.toLocaleString('en-LK')}`;
};

/**
 * Get achievement points
 */
export const ACHIEVEMENT_POINTS = {
  zero_violations_week: 100,
  perfect_month: 500,
  speed_champion: 200,
  smooth_operator: 150,
  acceleration_master: 150,
  route_expert: 300,
  early_bird: 50,
  night_owl: 50,
  weekend_warrior: 100
};
