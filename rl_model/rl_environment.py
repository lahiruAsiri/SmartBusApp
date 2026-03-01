# rl_model/rl_environment.py
# Reinforcement Learning Environment for Driver Reward System
# Models the driving environment as an MDP (Markov Decision Process)
#
# STATE:  [violation_bucket, safe_days_bucket, speed_bucket]  → discrete buckets for Q-table
# ACTION: 0=Standard, 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
# REWARD: +ve if driver improves next session, -ve if worsens, 0 if same

import numpy as np

# ─── Tier definitions ────────────────────────────────────────────────────────
TIERS = ['Standard', 'Bronze', 'Silver', 'Gold', 'Platinum']

TIER_CONFIG = {
    'Standard': {'points': 25,  'bonus': 0},
    'Bronze':   {'points': 75,  'bonus': 1500},
    'Silver':   {'points': 150, 'bonus': 3000},
    'Gold':     {'points': 300, 'bonus': 5000},
    'Platinum': {'points': 500, 'bonus': 8000},
}

# ─── State discretization ─────────────────────────────────────────────────────
# Violations: 0=[0-2], 1=[3-6], 2=[7-11], 3=[12-16], 4=[17+]
VIOLATION_BINS = [3, 7, 12, 17]

# Safe days:  0=[0-10], 1=[11-25], 2=[26-45], 3=[46-70], 4=[71+]
SAFE_DAYS_BINS = [11, 26, 46, 71]

# Speed over: 0=[0-5], 1=[6-15], 2=[16-25], 3=[26-35], 4=[36+]
SPEED_BINS = [6, 16, 26, 36]

NUM_VIOLATION_STATES = len(VIOLATION_BINS) + 1   # 5
NUM_SAFE_DAY_STATES  = len(SAFE_DAYS_BINS) + 1   # 5
NUM_SPEED_STATES     = len(SPEED_BINS) + 1        # 5
NUM_ACTIONS          = len(TIERS)                 # 5


def discretize(value: float, bins: list) -> int:
    """Map a continuous value into a discrete bucket index."""
    for i, threshold in enumerate(bins):
        if value < threshold:
            return i
    return len(bins)


def encode_state(violations: int, safe_days: int, avg_speed_over: float) -> tuple:
    """Convert raw driver stats into a discrete (3-tuple) state."""
    v = discretize(violations, VIOLATION_BINS)
    s = discretize(safe_days, SAFE_DAYS_BINS)
    p = discretize(avg_speed_over, SPEED_BINS)
    return (v, s, p)


def compute_reward(
    prev_violations: int,
    curr_violations: int,
    prev_safe_days: int,
    curr_safe_days: int,
    action: int
) -> float:
    """
    Compute the RL reward signal based on how driver behavior changed.

    Positive reward  → driver improved (fewer violations, more safe days)
    Negative reward  → driver worsened
    Small penalty    → over-rewarding a worsening driver
    Small bonus      → correctly rewarding an improving driver
    """
    reward = 0.0

    # Violation change component
    viol_delta = prev_violations - curr_violations   # +ve means fewer violations
    reward += viol_delta * 2.0

    # Safe day streak component
    streak_delta = curr_safe_days - prev_safe_days   # +ve means longer streak
    reward += streak_delta * 0.5

    # Alignment penalty: punish high-tier actions for worsening drivers
    if viol_delta < 0 and action >= 3:   # gave Gold/Platinum but violations increased
        reward -= 5.0

    # Alignment bonus: reward correct high-tier action for improving driver
    if viol_delta > 0 and curr_safe_days > 30 and action >= 3:
        reward += 3.0

    return float(np.clip(reward, -10.0, 10.0))


class DriverEnvironment:
    """
    Simulates one driver's driving session for RL training.
    The agent observes state, picks a tier-action, gets a reward.
    """

    def __init__(self):
        self.violations   = 0
        self.safe_days    = 0
        self.speed_over   = 0.0
        self.prev_violations = 0
        self.prev_safe_days  = 0

    def reset(self, violations: int, safe_days: int, avg_speed_over: float):
        """Load real IoT data as the starting state."""
        self.prev_violations = self.violations
        self.prev_safe_days  = self.safe_days
        self.violations  = violations
        self.safe_days   = safe_days
        self.speed_over  = avg_speed_over
        return encode_state(violations, safe_days, avg_speed_over)

    def step(self, action: int):
        """
        Agent takes an action (assigns a tier).
        Returns: (state, reward, done, info)
        """
        reward = compute_reward(
            self.prev_violations, self.violations,
            self.prev_safe_days,  self.safe_days,
            action
        )
        tier   = TIERS[action]
        state  = encode_state(self.violations, self.safe_days, self.speed_over)
        info   = {
            'tier':          tier,
            'safety_score':  _score_from_state(state),
            'points_earned': TIER_CONFIG[tier]['points'],
            'monthly_bonus': TIER_CONFIG[tier]['bonus'],
        }
        return state, reward, True, info   # done=True (single-step episode)


def _score_from_state(state: tuple) -> float:
    """Map discrete state tuple to a human-readable 0–100 safety score."""
    v, s, p   = state
    max_score = 100.0
    score = max_score - (v * 12) + (s * 5) - (p * 6)
    return float(np.clip(score, 0.0, 100.0))
