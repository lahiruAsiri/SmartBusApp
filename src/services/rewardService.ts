// src/services/rewardService.ts
// Driver Reward Service — Q-Learning Reinforcement Learning Integration
// Tier/Score predictions come from the Python RL model (rl_model/app.py)
// The model learns from real IoT sessions via /learn endpoint.
// Falls back to rule-based scoring if API is unreachable.
import { TierType } from '../utils/rewardCalculations';
import { database } from '../api/firebase';
import { ref, get } from 'firebase/database';

// ─── RL API Config ──────────────────────────────────────────────────────────
// On physical device: change to your PC's local IP (run `ipconfig`)
// e.g. 'http://192.168.1.10:5000'
const RL_API_URL = 'http://192.168.43.194:5001';

export interface RLPrediction {
  safety_score:  number;
  tier:          TierType;
  action_idx:    number;
  points_earned: number;
  monthly_bonus: number;
  confidence:    Record<string, number>;   // tier → confidence 0-1
  q_values:      Record<string, number>;   // tier → raw Q-value
  state: {
    violation_bucket: number;
    safe_day_bucket:  number;
    speed_bucket:     number;
  };
}

// ─── Predict tier (inference) ──────────────────────────────────────────────
export const predictDriverTier = async (
  violations:    number,
  safeDays:      number,
  avgSpeedOver:  number,
): Promise<RLPrediction> => {
  try {
    const res = await fetch(`${RL_API_URL}/predict-tier`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ violations, safe_days: safeDays, avg_speed_over: avgSpeedOver }),
    });
    if (!res.ok) throw new Error(`RL API error: ${res.status}`);
    return await res.json() as RLPrediction;
  } catch (err) {
    console.warn('⚠️ RL API unreachable. Using fallback scoring.', err);
    return _fallbackScoring(violations, safeDays, avgSpeedOver);
  }
};

// ─── Learn from a real IoT session (updates Q-table on server) ────────────
export const learnFromSession = async (
  prev: { violations: number; safeDays: number; speedOver: number },
  curr: { violations: number; safeDays: number; speedOver: number },
): Promise<void> => {
  try {
    await fetch(`${RL_API_URL}/learn`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prev_violations: prev.violations, prev_safe_days: prev.safeDays, prev_speed_over: prev.speedOver,
        curr_violations: curr.violations, curr_safe_days: curr.safeDays, curr_speed_over: curr.speedOver,
      }),
    });
  } catch (err) {
    console.warn('⚠️ RL learn endpoint unreachable.', err);
  }
};

// ─── Fallback rule-based scoring (when API is down) ───────────────────────
const _fallbackScoring = (
  violations: number, safeDays: number, avgSpeedOver: number,
): RLPrediction => {
  const score = Math.max(0, Math.min(100,
    100 - violations * 12 + safeDays * 0.5 - avgSpeedOver * 0.6
  ));
  let tier: TierType;
  let points_earned: number;
  let monthly_bonus: number;
  if (score >= 88)      { tier = 'Platinum'; points_earned = 500; monthly_bonus = 8000; }
  else if (score >= 75) { tier = 'Gold';     points_earned = 300; monthly_bonus = 5000; }
  else if (score >= 60) { tier = 'Silver';   points_earned = 150; monthly_bonus = 3000; }
  else if (score >= 40) { tier = 'Bronze';   points_earned = 75;  monthly_bonus = 1500; }
  else                  { tier = 'Standard'; points_earned = 25;  monthly_bonus = 0;    }
  return {
    safety_score: Math.round(score * 10) / 10, tier, action_idx: 0,
    points_earned, monthly_bonus,
    confidence: { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0, Standard: 0, [tier]: 1 },
    q_values:   { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0, Standard: 0 },
    state:      { violation_bucket: 0, safe_day_bucket: 0, speed_bucket: 0 },
  };
};

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  target?: number;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  icon: string;
  category: 'voucher' | 'benefit' | 'prize';
  available: boolean;
}

export interface DriverRewardData {
  driverId: string;
  name: string;
  busId: string;
  currentTier: TierType;
  safetyScore: number;
  totalTrips: number;
  totalViolations: number;
  totalPoints: number;
  currentMonthBonus: number;
  currentStreak: number;
  longestStreak: number;
  lastViolationDate: string | null;
  achievements: Achievement[];
  rewardHistory: RewardHistory[];
}

export interface RewardHistory {
  id: string;
  date: string;
  type: 'bonus' | 'redemption' | 'achievement';
  description: string;
  amount?: number;
  points?: number;
}

export interface LeaderboardEntry {
  rank: number;
  driverId: string;
  name: string;
  busId: string;
  safetyScore: number;
  tier: TierType;
  streak: number;
  isCurrentUser?: boolean;
}

// Dummy data for current driver
export const DUMMY_DRIVER_DATA: DriverRewardData = {
  driverId: 'driver_001',
  name: 'Kamal Perera',
  busId: 'WP-NC-5544',
  currentTier: 'Gold',
  safetyScore: 25,
  totalTrips: 450,
  totalViolations: 12,
  totalPoints: 2500,
  currentMonthBonus: 3000,
  currentStreak: 15,
  longestStreak: 45,
  lastViolationDate: '2025-12-20',
  achievements: [
    {
      id: 'zero_violations_week',
      title: 'Zero Violations Week',
      description: 'Complete 7 days without any violations',
      icon: 'checkmark-circle',
      points: 100,
      unlocked: true,
      unlockedDate: '2026-01-01'
    },
    {
      id: 'perfect_month',
      title: '30-Day Perfect Record',
      description: 'Complete 30 consecutive days without violations',
      icon: 'trophy',
      points: 500,
      unlocked: false,
      progress: 15,
      target: 30
    },
    {
      id: 'speed_champion',
      title: 'Speed Limit Champion',
      description: 'No speeding violations for 1 month',
      icon: 'speedometer',
      points: 200,
      unlocked: true,
      unlockedDate: '2025-12-15'
    },
    {
      id: 'smooth_operator',
      title: 'Smooth Operator',
      description: 'No harsh braking for 2 weeks',
      icon: 'hand-left',
      points: 150,
      unlocked: false,
      progress: 8,
      target: 14
    },
    {
      id: 'acceleration_master',
      title: 'Acceleration Master',
      description: 'No harsh acceleration for 1 month',
      icon: 'flash',
      points: 150,
      unlocked: false,
      progress: 12,
      target: 30
    },
    {
      id: 'route_expert',
      title: 'Route Expert',
      description: 'Complete 100 trips on the same route',
      icon: 'map',
      points: 300,
      unlocked: true,
      unlockedDate: '2025-11-20'
    },
    {
      id: 'early_bird',
      title: 'Early Bird',
      description: 'Complete 20 morning shifts (5 AM - 9 AM)',
      icon: 'sunny',
      points: 50,
      unlocked: true,
      unlockedDate: '2025-10-10'
    },
    {
      id: 'weekend_warrior',
      title: 'Weekend Warrior',
      description: 'Work 10 consecutive weekends',
      icon: 'calendar',
      points: 100,
      unlocked: false,
      progress: 6,
      target: 10
    }
  ],
  rewardHistory: [
    {
      id: 'rh_001',
      date: '2025-12-31',
      type: 'bonus',
      description: 'Monthly Performance Bonus - Gold Tier',
      amount: 3000
    },
    {
      id: 'rh_002',
      date: '2025-12-15',
      type: 'achievement',
      description: 'Speed Limit Champion Achievement',
      points: 200
    },
    {
      id: 'rh_003',
      date: '2025-12-10',
      type: 'redemption',
      description: 'Fuel Voucher - LKR 500',
      points: -500
    },
    {
      id: 'rh_004',
      date: '2025-11-30',
      type: 'bonus',
      description: 'Monthly Performance Bonus - Gold Tier',
      amount: 3000
    }
  ]
};

// Dummy leaderboard data
export const DUMMY_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    driverId: 'driver_005',
    name: 'Nimal Silva',
    busId: 'WP-NC-1122',
    safetyScore: 8,
    tier: 'Platinum',
    streak: 60
  },
  {
    rank: 2,
    driverId: 'driver_012',
    name: 'Sunil Fernando',
    busId: 'WP-NC-3344',
    safetyScore: 12,
    tier: 'Platinum',
    streak: 45
  },
  {
    rank: 3,
    driverId: 'driver_008',
    name: 'Ranjith Kumar',
    busId: 'NB-2231',
    safetyScore: 18,
    tier: 'Gold',
    streak: 30
  },
  {
    rank: 4,
    driverId: 'driver_001',
    name: 'Kamal Perera',
    busId: 'WP-NC-5544',
    safetyScore: 25,
    tier: 'Gold',
    streak: 15,
    isCurrentUser: true
  },
  {
    rank: 5,
    driverId: 'driver_015',
    name: 'Ajith Bandara',
    busId: 'SP-7788',
    safetyScore: 28,
    tier: 'Gold',
    streak: 22
  },
  {
    rank: 6,
    driverId: 'driver_003',
    name: 'Chaminda Dias',
    busId: 'WP-NC-6677',
    safetyScore: 35,
    tier: 'Silver',
    streak: 10
  },
  {
    rank: 7,
    driverId: 'driver_019',
    name: 'Pradeep Jayasinghe',
    busId: 'WP-NC-8899',
    safetyScore: 42,
    tier: 'Silver',
    streak: 8
  },
  {
    rank: 8,
    driverId: 'driver_007',
    name: 'Mahesh Wickramasinghe',
    busId: 'NB-4455',
    safetyScore: 48,
    tier: 'Silver',
    streak: 5
  },
  {
    rank: 9,
    driverId: 'driver_011',
    name: 'Lasantha Perera',
    busId: 'SP-9900',
    safetyScore: 55,
    tier: 'Bronze',
    streak: 12
  },
  {
    rank: 10,
    driverId: 'driver_014',
    name: 'Upul Tharanga',
    busId: 'WP-NC-2233',
    safetyScore: 62,
    tier: 'Bronze',
    streak: 7
  }
];

// Dummy available rewards
export const DUMMY_AVAILABLE_REWARDS: RewardItem[] = [
  {
    id: 'reward_001',
    title: 'Fuel Voucher - LKR 500',
    description: 'Redeemable at any Ceypetco station',
    pointsCost: 500,
    icon: 'water',
    category: 'voucher',
    available: true
  },
  {
    id: 'reward_002',
    title: 'Mobile Data - 5GB',
    description: 'Dialog/Mobitel/Hutch data package',
    pointsCost: 300,
    icon: 'phone-portrait',
    category: 'voucher',
    available: true
  },
  {
    id: 'reward_003',
    title: 'Meal Coupon - LKR 1000',
    description: 'Valid at partner restaurants',
    pointsCost: 800,
    icon: 'restaurant',
    category: 'voucher',
    available: true
  },
  {
    id: 'reward_004',
    title: 'Movie Tickets (2)',
    description: 'Any Scope Cinemas location',
    pointsCost: 1000,
    icon: 'film',
    category: 'prize',
    available: true
  },
  {
    id: 'reward_005',
    title: 'Priority Shift Selection',
    description: 'Choose your preferred shifts for 1 week',
    pointsCost: 1200,
    icon: 'calendar',
    category: 'benefit',
    available: true
  },
  {
    id: 'reward_006',
    title: 'Extended Break Time',
    description: '+30 minutes break time for 1 month',
    pointsCost: 1500,
    icon: 'time',
    category: 'benefit',
    available: true
  },
  {
    id: 'reward_007',
    title: 'Shopping Voucher - LKR 2000',
    description: 'Keells/Arpico/Laugfs voucher',
    pointsCost: 1800,
    icon: 'cart',
    category: 'voucher',
    available: false
  },
  {
    id: 'reward_008',
    title: 'Advanced Driving Course',
    description: 'Free professional training course',
    pointsCost: 2500,
    icon: 'school',
    category: 'benefit',
    available: true
  }
];

// Service functions
export const getDriverRewardData = async (): Promise<DriverRewardData> => {
  try {
    // 1. Fetch real violations from IoT device (Bus_01) in Realtime Database
    const busViolationsRef = ref(database, 'Bus_01/violations');
    const snapshot = await get(busViolationsRef);
    
    let totalViolations = 0;
    let lastViolationDate: Date | null = null;

    if (snapshot.exists()) {
      const data = snapshot.val();
      const violationsList = Object.keys(data).map(key => ({
        ...data[key],
        timestamp: new Date(data[key].dateTime.replace(' ', 'T')),
      }));
      
      totalViolations = violationsList.length;

      if (violationsList.length > 0) {
        // Sort to find the most recent violation
        violationsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        lastViolationDate = violationsList[0].timestamp;
      }
    }

    // 2. Calculate current safe streak (days since last violation)
    let safeDays = 0;
    const today = new Date();
    if (lastViolationDate) {
      const diffTime = Math.abs(today.getTime() - lastViolationDate.getTime());
      safeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } else {
      safeDays = 30; // If no violations exist, assume 30 safe days initially
    }

    // 3. Return combined data (real stats + dummy info footprint)
    return {
      ...DUMMY_DRIVER_DATA,
      totalViolations: totalViolations,
      currentStreak: safeDays,
      lastViolationDate: lastViolationDate ? lastViolationDate.toISOString() : null,
    };

  } catch (error) {
    console.error("Error fetching live driver data from Firebase:", error);
    // Fallback to dummy data safely if Firebase fails
    return DUMMY_DRIVER_DATA;
  }
};

export const getLeaderboard = (): Promise<LeaderboardEntry[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(DUMMY_LEADERBOARD), 500);
  });
};

export const getAvailableRewards = (): Promise<RewardItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(DUMMY_AVAILABLE_REWARDS), 500);
  });
};

export const redeemReward = (rewardId: string, pointsCost: number): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate redemption
      DUMMY_DRIVER_DATA.totalPoints -= pointsCost;
      resolve(true);
    }, 1000);
  });
};
