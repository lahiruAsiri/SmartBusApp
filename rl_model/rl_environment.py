# rl_model/rl_environment.py
# Reinforcement Learning Environment for Driver Reward System
# Models the driving environment as an MDP (Markov Decision Process)
#
# STATE:  [violation_bucket]  → discrete bucket based on total weighted violations
# ACTION: 0=Standard, 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
# REWARD: +ve if driver improves next session, -ve if worsens
#
# VIOLATION WEIGHTING RULES:
#   - 1 Speeding           = 1 full violation
#   - 10 Harsh Accelerations = 1 violation  (each event = 0.1)
#   - 10 Sudden Brakes       = 1 violation  (each event = 0.1)
#
# SCORE FORMULA:
#   score = max(0, 100 - weighted_violations * 5)
#
# TIER THRESHOLDS (monthly):
#   Platinum  → score 88-100  (0-2 weighted violations)
#   Gold      → score 75-87   (3-5 weighted violations)
#   Silver    → score 60-74   (6-8 weighted violations)
#   Bronze    → score 40-59   (9-12 weighted violations)
#   Standard  → score 0-39    (13+ weighted violations)

import numpy as np

# ─── Tier definitions ─────────────────────────────────────────────────────────
TIERS = ['Standard', 'Bronze', 'Silver', 'Gold', 'Platinum']

TIER_CONFIG = {
    'Standard': {'points': 25,  'bonus': 0},
    'Bronze':   {'points': 75,  'bonus': 1500},
    'Silver':   {'points': 150, 'bonus': 3000},
    'Gold':     {'points': 300, 'bonus': 5000},
    'Platinum': {'points': 500, 'bonus': 8000},
}

# ─── State discretization ─────────────────────────────────────────────────────
# Weighted violations: 0=[0-2], 1=[3-5], 2=[6-8], 3=[9-12], 4=[13+]
# Matching tier thresholds so Q-table state maps directly to tier quality
VIOLATION_BINS = [3, 6, 9, 13]

NUM_VIOLATION_STATES = len(VIOLATION_BINS) + 1   # 5
NUM_ACTIONS          = len(TIERS)                 # 5


def compute_weighted_violations(
    speeding: int,
    harsh_accel: int,
    sudden_brake: int,
) -> float:
    """
    Convert raw IoT event counts into a single weighted violation number.

    Rules:
      - Each speeding event       = 1 full violation
      - Every 10 harsh accelerations = 1 violation  (0.1 each)
      - Every 10 sudden brakes       = 1 violation  (0.1 each)
    """
    return speeding + (harsh_accel / 10.0) + (sudden_brake / 10.0)


def discretize(value: float, bins: list) -> int:
    """Map a continuous value into a discrete bucket index."""
    for i, threshold in enumerate(bins):
        if value < threshold:
            return i
    return len(bins)


def encode_state(weighted_violations: float) -> tuple:
    """Convert weighted violations into a 1-element discrete state tuple."""
    v = discretize(weighted_violations, VIOLATION_BINS)
    return (v,)


def score_from_violations(weighted_violations: float) -> float:
    """
    Compute safety score from weighted violations.
    Formula: max(0, 100 - weighted_violations * 5)
    """
    return float(np.clip(100.0 - weighted_violations * 5.0, 0.0, 100.0))


def tier_from_score(score: float) -> str:
    """Determine tier directly from safety score."""
    if score >= 88:
        return 'Platinum'
    elif score >= 75:
        return 'Gold'
    elif score >= 60:
        return 'Silver'
    elif score >= 40:
        return 'Bronze'
    else:
        return 'Standard'


def compute_reward(
    prev_weighted: float,
    curr_weighted: float,
    action: int,
) -> float:
    """
    Compute the RL reward signal based on how driver behavior changed.

    Positive reward → driver had fewer violations (improved)
    Negative reward → driver had more violations (worsened)
    """
    reward = 0.0

    # Violation change: +ve means fewer violations (improved)
    viol_delta = prev_weighted - curr_weighted
    reward += viol_delta * 2.0

    # Alignment penalty: punish high-tier actions for worsening drivers
    tier_of_action = TIERS[action]
    curr_score = score_from_violations(curr_weighted)
    expected_tier = tier_from_score(curr_score)
    expected_action = TIERS.index(expected_tier)

    if action > expected_action:
        reward -= 3.0  # gave too high a tier
    elif action < expected_action:
        reward -= 1.0  # gave too low a tier
    else:
        reward += 2.0  # correct tier assigned

    return float(np.clip(reward, -10.0, 10.0))


# Keep backward-compat alias used by the agent
def _score_from_state(state: tuple) -> float:
    """Map discrete state back to an approximate safety score (for display)."""
    v_bucket = state[0]
    # Midpoints of each bucket
    midpoints = [1.0, 4.0, 7.0, 10.5, 15.0]
    approx_violations = midpoints[min(v_bucket, len(midpoints) - 1)]
    return score_from_violations(approx_violations)
