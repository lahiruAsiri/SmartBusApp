// src/services/rewardService.ts
// Driver Reward Service — Q-Learning Reinforcement Learning Integration
// Tier/Score predictions come from the Python RL model (rl_model/app.py)
// The model learns from real IoT sessions via /learn endpoint.
// Falls back to rule-based scoring if API is unreachable.
import { TierType } from '../utils/rewardCalculations';
import { database } from '../api/firebase';
import { ref, get } from 'firebase/database';

// On physical device: set EXPO_PUBLIC_RL_API_URL in your .env file to your ngrok URL
// e.g. EXPO_PUBLIC_RL_API_URL=https://a1b2-xxxx.ngrok-free.app
const RL_API_URL = process.env.EXPO_PUBLIC_RL_API_URL ?? 'http://localhost:5001';

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
  };
}

// ─── Predict tier (inference) ──────────────────────────────────────────────
export const predictDriverTier = async (
  speeding:    number,
  harshAccel:  number,
  suddenBrake: number,
): Promise<RLPrediction> => {
  try {
    const res = await fetch(`${RL_API_URL}/predict-tier`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ speeding, harsh_accel: harshAccel, sudden_brake: suddenBrake }),
      signal:  AbortSignal.timeout(3000), // ← fail fast: 3 s max
    });
    if (!res.ok) throw new Error(`RL API error: ${res.status}`);
    return await res.json() as RLPrediction;
  } catch (err) {
    console.warn('⚠️ RL API unreachable. Using fallback scoring.', err);
    return _fallbackScoring(speeding, harshAccel, suddenBrake);
  }
};

// ─── Learn from a real IoT session (updates Q-table on server) ────────────
export const learnFromSession = async (
  prev: { speeding: number; harshAccel: number; suddenBrake: number },
  curr: { speeding: number; harshAccel: number; suddenBrake: number },
): Promise<void> => {
  try {
    await fetch(`${RL_API_URL}/learn`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prev_speeding: prev.speeding, prev_harsh_accel: prev.harshAccel, prev_sudden_brake: prev.suddenBrake,
        curr_speeding: curr.speeding, curr_harsh_accel: curr.harshAccel, curr_sudden_brake: curr.suddenBrake,
      }),
    });
  } catch (err) {
    console.warn('⚠️ RL learn endpoint unreachable.', err);
  }
};

// ─── Fallback rule-based scoring (when API is down) ───────────────────────
const _fallbackScoring = (
  speeding: number, harshAccel: number, suddenBrake: number,
): RLPrediction => {
  // Same formula as Python model for consistency
  const weighted = speeding + (harshAccel / 10.0) + (suddenBrake / 10.0);
  const score = Math.max(0, Math.min(100, 100 - weighted * 5));

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
    state:      { violation_bucket: 0 },
  };
};

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;      // currently earned points (may be scaled)
  maxPoints?: number;  // maximum possible points (for display as earned/max)
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
  // Raw IoT violation counts (for RL model)
  rawSpeeding:    number;
  rawHarshAccel:  number;
  rawSuddenBrake: number;
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
      description: 'Keep speeding violations under 15',
      icon: 'speedometer',
      points: 200,
      unlocked: true,
      progress: 0,
      target: 15
    },
    {
      id: 'smooth_operator',
      title: 'Smooth Operator',
      description: 'Keep harsh braking violations under 10',
      icon: 'hand-left',
      points: 150,
      unlocked: false,
      progress: 8,
      target: 10
    },
    {
      id: 'acceleration_master',
      title: 'Acceleration Master',
      description: 'Keep harsh acceleration violations under 15',
      icon: 'flash',
      points: 150,
      unlocked: false,
      progress: 12,
      target: 15
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
  ],
  // Raw IoT violation count defaults
  rawSpeeding:    0,
  rawHarshAccel:  0,
  rawSuddenBrake: 0,
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

// ─── Compute achievements from real violation data ────────────────────────────
// Achievements that depend on Firebase data are evaluated live.
// Shift-based achievements (Early Bird, Weekend Warrior) stay static
// because we don't have shift-schedule data in Firebase.
const computeAchievements = (
  safeDays:    number,
  rawSpeeding: number,
  rawAccel:    number,
  rawBrake:    number,
  totalTrips:  number,
): Achievement[] => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return [
    // ── 1. Zero Violations Week ───────────────────────────────────────────
    {
      id:          'zero_violations_week',
      title:       'Zero Violations Week',
      description: 'Complete 7 days without any violations',
      icon:        'checkmark-circle',
      points:      100,
      unlocked:    safeDays >= 7,
      unlockedDate: safeDays >= 7 ? today : undefined,
      progress:    Math.min(safeDays, 7),
      target:      7,
    },

    // ── 2. 30-Day Perfect Record ──────────────────────────────────────────
    {
      id:          'perfect_month',
      title:       '30-Day Perfect Record',
      description: 'Complete 30 consecutive days without violations',
      icon:        'trophy',
      points:      500,
      unlocked:    safeDays >= 30,
      unlockedDate: safeDays >= 30 ? today : undefined,
      progress:    Math.min(safeDays, 30),
      target:      30,
    },

    // ── 3. Speed Limit Champion — locked when rawSpeeding >= 15 ────────────────
    {
      id:          'speed_champion',
      title:       'Speed Limit Champion',
      description: 'Keep speeding violations under 15',
      icon:        'speedometer',
      points:      Math.round(200 * Math.max(0, 15 - rawSpeeding) / 15),
      maxPoints:   200,
      unlocked:    rawSpeeding < 15,
      progress:    Math.min(rawSpeeding, 15),
      target:      15,
    },

    // ── 4. Smooth Operator — locked when rawBrake >= 10 ─────────────────────
    {
      id:          'smooth_operator',
      title:       'Smooth Operator',
      description: 'Keep harsh braking violations under 10',
      icon:        'hand-left',
      points:      Math.round(150 * Math.max(0, 10 - rawBrake) / 10),
      maxPoints:   150,
      unlocked:    rawBrake < 10,
      progress:    Math.min(rawBrake, 10),
      target:      10,
    },

    // ── 5. Acceleration Master — locked when rawAccel >= 15 ──────────────────
    {
      id:          'acceleration_master',
      title:       'Acceleration Master',
      description: 'Keep harsh acceleration violations under 15',
      icon:        'flash',
      points:      Math.round(150 * Math.max(0, 15 - rawAccel) / 15),
      maxPoints:   150,
      unlocked:    rawAccel < 15,
      progress:    Math.min(rawAccel, 15),
      target:      15,
    },


    // ── 7. Early Bird — static (no shift data in Firebase) ───────────────
    {
      id:          'early_bird',
      title:       'Early Bird',
      description: 'Complete 20 morning shifts (5 AM – 9 AM)',
      icon:        'sunny',
      points:      50,
      unlocked:    false,
      progress:    0,
      target:      20,
    },

    // ── 8. Weekend Warrior — static (no shift data in Firebase) ─────────
    {
      id:          'weekend_warrior',
      title:       'Weekend Warrior',
      description: 'Work 10 consecutive weekends',
      icon:        'calendar',
      points:      100,
      unlocked:    false,
      progress:    0,
      target:      10,
    },
  ];
};

// Service functions
export const getDriverRewardData = async (): Promise<DriverRewardData> => {
  try {
    // 1. Fetch real violations from IoT device (Bus_01) in Realtime Database
    const busViolationsRef = ref(database, 'Bus_01/violations');
    const snapshot = await get(busViolationsRef);
    
    let rawSpeeding = 0, rawAccel = 0, rawBrake = 0;
    let lastViolationDate: Date | null = null;

    if (snapshot.exists()) {
      const data = snapshot.val();
      const violationsList = Object.keys(data).map(key => ({
        ...data[key],
        timestamp: new Date(data[key].dateTime.replace(' ', 'T')),
      }));

      // Calculate categorized violations
      Object.keys(data).forEach((key) => {
        const v = data[key];
        const type = String(v.type).toLowerCase();
        if (type.includes("speed")) rawSpeeding++;
        else if (type.includes("accel")) rawAccel++;
        else if (type.includes("brake") || type.includes("sudden")) rawBrake++;
      });

      if (violationsList.length > 0) {
        // Sort to find the most recent violation
        violationsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        lastViolationDate = violationsList[0].timestamp;
      }
    }

    // Raw count of all violation events (not weighted — 8+5+2 = 15, not 9)
    const totalViolations = rawSpeeding + rawAccel + rawBrake;

    // 2. Calendar streak (days since last violation) — used for UI display only
    const today = new Date();
    let safeDays = 0; // display streak
    if (lastViolationDate) {
      const diffTime = Math.abs(today.getTime() - lastViolationDate.getTime());
      safeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Achievement streak: consecutive ACTIVE DRIVING days with no violations.
    // Firebase only stores violation events — clean driving days leave no record.
    // Device was off between drives, so gap days are NOT clean driving days.
    // Until a session/trip log is added to Firebase, this stays 0 when violations exist.
    const achievementSafeDays = 0;

    // 3. Query the RL model API to get real predictions (pass raw counts)
    let currentTier: TierType = 'Standard';
    let safetyScore = Math.max(0, 100 - (rawSpeeding + Math.floor(rawAccel / 10) + Math.floor(rawBrake / 10)) * 5);
    let totalPoints = 0;
    let currentMonthBonus = 0;

    try {
      const prediction = await predictDriverTier(rawSpeeding, rawAccel, rawBrake);
      currentTier = prediction.tier;
      safetyScore = prediction.safety_score;
      totalPoints = prediction.points_earned !== undefined ? Number(prediction.points_earned) : 0;
      currentMonthBonus = prediction.monthly_bonus !== undefined ? Number(prediction.monthly_bonus) : 0;
    } catch (e) {
      console.warn("Failed to retrieve true RL predictions", e);
    }

    // 4. Compute achievements from real stats
    // achievementSafeDays = 0: the device's last recorded state was a violation day (Mar 1).
    // Off days afterward are NOT confirmed clean driving days.
    const achievements = computeAchievements(
      achievementSafeDays,          // 0 — no confirmed clean driving sessions
      rawSpeeding,
      rawAccel,
      rawBrake,
      DUMMY_DRIVER_DATA.totalTrips, // trips not yet in Firebase, use dummy
    );

    // 5. Return combined data (real stats + RL predictions + live achievements)
    return {
      ...DUMMY_DRIVER_DATA,
      totalViolations: totalViolations,
      currentStreak: safeDays,
      longestStreak: Math.max(DUMMY_DRIVER_DATA.longestStreak, safeDays),
      lastViolationDate: lastViolationDate ? lastViolationDate.toISOString() : null,
      currentTier,
      safetyScore,
      totalPoints,
      currentMonthBonus,
      rawSpeeding,
      rawHarshAccel: rawAccel,
      rawSuddenBrake: rawBrake,
      achievements,
    };

  } catch (error) {
    console.error("Error fetching live driver data from Firebase:", error);
    // Fallback to dummy data safely if Firebase fails
    return DUMMY_DRIVER_DATA;
  }
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    // ── 1. Fetch real violations for Bus_01 from Firebase ─────────────────
    const busViolationsRef = ref(database, 'Bus_01/violations');
    const snapshot = await get(busViolationsRef);

    let rawSpeeding = 0, rawAccel = 0, rawBrake = 0;
    let lastViolationDate: Date | null = null;

    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach((key) => {
        const v = data[key];
        const type = String(v.type).toLowerCase();
        if (type.includes('speed'))                      rawSpeeding++;
        else if (type.includes('accel'))                 rawAccel++;
        else if (type.includes('brake') || type.includes('sudden')) rawBrake++;
      });

      const violations = Object.values(data as Record<string, any>).map((v: any) => ({
        timestamp: new Date((v.dateTime ?? '').replace(' ', 'T')),
      }));
      violations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      if (violations.length > 0) lastViolationDate = violations[0].timestamp;
    }

    // ── 2. Compute safety score via RL model (falls back in ≤3 s) ─────────
    const prediction = await predictDriverTier(rawSpeeding, rawAccel, rawBrake);
    const realSafetyScore = Math.round(prediction.safety_score);
    const realTier        = prediction.tier;

    // ── 3. Calculate safe-day streak ──────────────────────────────────────
    let safeDays = 30;
    if (lastViolationDate) {
      const diffMs = Math.abs(new Date().getTime() - lastViolationDate.getTime());
      safeDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    // ── 4. Build the real-driver entry (replacing the dummy placeholder) ──
    const realEntry: LeaderboardEntry = {
      rank:          0,          // will be set after sort
      driverId:      'bus_01_real',
      name:          'Ridma',
      busId:         'Bus_01',
      safetyScore:   realSafetyScore,
      tier:          realTier,
      streak:        safeDays,
      isCurrentUser: true,
    };

    // ── 5. Merge: drop old dummy placeholder, add real entry ─────────────
    const dummyWithoutPlaceholder = DUMMY_LEADERBOARD.filter(
      (e) => !e.isCurrentUser
    );
    const merged = [...dummyWithoutPlaceholder, realEntry];

    // ── 6. Sort by safety score ascending (lower score = fewer violations = better)
    //      then reassign ranks 1…n
    merged.sort((a, b) => a.safetyScore - b.safetyScore);
    merged.forEach((entry, idx) => { entry.rank = idx + 1; });

    return merged;
  } catch (err) {
    console.warn('getLeaderboard: falling back to dummy data', err);
    return DUMMY_LEADERBOARD;
  }
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
