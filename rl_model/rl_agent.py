# rl_model/rl_agent.py
# Q-Learning Agent for Driver Reward System
#
# Uses a Q-table (dictionary) indexed by (state, action).
# Q-values are updated using the Bellman equation after each real driving session.
# The Q-table is persisted to q_table.json so it survives restarts.
#
# STATE is now 1D: only violation_bucket (0-4)
# This makes the model simple, transparent, and easy to explain.

import numpy as np
import json
import os
from rl_environment import (
    NUM_VIOLATION_STATES, NUM_ACTIONS, TIERS, TIER_CONFIG,
    encode_state, _score_from_state, compute_weighted_violations,
    score_from_violations, tier_from_score, compute_reward
)

Q_TABLE_PATH = os.path.join(os.path.dirname(__file__), 'q_table.json')


class QLearningAgent:
    """
    Tabular Q-Learning agent.

    Q(s, a) ← Q(s, a) + α [ r + γ·max_a'Q(s', a') - Q(s, a) ]

    α (alpha)   = learning rate   — how fast to update
    γ (gamma)   = discount factor — how much future matters
    ε (epsilon) = exploration     — probability of random action
    """

    def __init__(
        self,
        alpha:   float = 0.1,
        gamma:   float = 0.9,
        epsilon: float = 0.1,
    ):
        self.alpha   = alpha
        self.gamma   = gamma
        self.epsilon = epsilon

        # Q-table: keys are "v_a" strings for JSON serialisability
        self.q_table: dict[str, float] = {}
        self._load()

    # ── persistence ──────────────────────────────────────────────────────────

    def _key(self, state: tuple, action: int) -> str:
        return f"{state[0]}_{action}"

    def _load(self):
        if os.path.exists(Q_TABLE_PATH):
            with open(Q_TABLE_PATH, 'r') as f:
                self.q_table = json.load(f)
            print(f"✅ Q-table loaded ({len(self.q_table)} entries)")
        else:
            self._warm_up()

    def save(self):
        with open(Q_TABLE_PATH, 'w') as f:
            json.dump(self.q_table, f, indent=2)

    # ── Q-table helpers ───────────────────────────────────────────────────────

    def get_q(self, state: tuple, action: int) -> float:
        return self.q_table.get(self._key(state, action), 0.0)

    def set_q(self, state: tuple, action: int, value: float):
        self.q_table[self._key(state, action)] = value

    def best_action(self, state: tuple) -> int:
        """Return the action with highest Q-value for this state."""
        q_values = [self.get_q(state, a) for a in range(NUM_ACTIONS)]
        return int(np.argmax(q_values))

    def choose_action(self, state: tuple) -> int:
        """ε-greedy: explore randomly or exploit best known action."""
        if np.random.random() < self.epsilon:
            return np.random.randint(NUM_ACTIONS)
        return self.best_action(state)

    # ── learning update ───────────────────────────────────────────────────────

    def update(
        self,
        state:      tuple,
        action:     int,
        reward:     float,
        next_state: tuple,
    ):
        """Bellman equation update."""
        current_q  = self.get_q(state, action)
        max_next_q = max(self.get_q(next_state, a) for a in range(NUM_ACTIONS))
        new_q = current_q + self.alpha * (reward + self.gamma * max_next_q - current_q)
        self.set_q(state, action, new_q)

    # ── warm-up: seed Q-table with domain knowledge ───────────────────────────

    def _warm_up(self):
        """
        Pre-populate Q-table with expert knowledge.

        Rule: lower violation bucket → prefer higher tier actions.
        State 0 (0-2 violations)  → Platinum (action 4)
        State 1 (3-5 violations)  → Gold     (action 3)
        State 2 (6-8 violations)  → Silver   (action 2)
        State 3 (9-12 violations) → Bronze   (action 1)
        State 4 (13+ violations)  → Standard (action 0)
        """
        print("🔄 Initialising Q-table with simplified warm-up...")
        # Ideal action for each violation bucket (0=best, 4=worst)
        ideal_actions = [4, 3, 2, 1, 0]  # Platinum → Standard

        for v in range(NUM_VIOLATION_STATES):
            state = (v,)
            ideal = ideal_actions[v]
            for a in range(NUM_ACTIONS):
                distance = abs(a - ideal)
                q_val = 10.0 - (distance * 3.0)
                self.set_q(state, a, q_val)

        self.save()
        print(f"✅ Q-table warm-up complete ({len(self.q_table)} entries saved)")

    # ── predict (inference) ───────────────────────────────────────────────────

    def predict(
        self,
        speeding:     int,
        harsh_accel:  int,
        sudden_brake: int,
    ) -> dict:
        """
        Given raw IoT violation counts, compute the weighted violations,
        safety score, tier, points, and monthly bonus.
        """
        # 1. Compute weighted violations
        weighted = compute_weighted_violations(speeding, harsh_accel, sudden_brake)

        # 2. Encode state and pick best action from Q-table
        state  = encode_state(weighted)
        action = self.best_action(state)
        tier   = TIERS[action]

        # 3. Compute score directly from weighted violations (transparent formula)
        score = score_from_violations(weighted)

        # Override tier with direct score-based mapping for full transparency
        # (Q-table action and score-based tier should agree after warm-up)
        direct_tier = tier_from_score(score)

        # Compute Q-value distribution (confidence in each tier)
        q_values   = [self.get_q(state, a) for a in range(NUM_ACTIONS)]
        q_min, q_max = min(q_values), max(q_values)
        span = q_max - q_min if q_max != q_min else 1.0
        confidence = {TIERS[a]: round((q_values[a] - q_min) / span, 3) for a in range(NUM_ACTIONS)}

        return {
            "safety_score":       round(score, 1),
            "tier":               direct_tier,
            "action_idx":         action,
            "weighted_violations": round(weighted, 2),
            "points_earned":      TIER_CONFIG[direct_tier]['points'],
            "monthly_bonus":      TIER_CONFIG[direct_tier]['bonus'],
            "confidence":         confidence,
            "q_values":           {TIERS[a]: round(q_values[a], 3) for a in range(NUM_ACTIONS)},
            "state":              {"violation_bucket": state[0]},
        }

    # ── learn from real IoT session ───────────────────────────────────────────

    def learn_from_session(
        self,
        prev_speeding:     int,
        prev_harsh_accel:  int,
        prev_sudden_brake: int,
        curr_speeding:     int,
        curr_harsh_accel:  int,
        curr_sudden_brake: int,
    ) -> dict:
        """
        Called after each real driving session to update the Q-table.
        Compares previous and current weighted violations to compute reward.
        """
        prev_weighted = compute_weighted_violations(prev_speeding, prev_harsh_accel, prev_sudden_brake)
        curr_weighted = compute_weighted_violations(curr_speeding, curr_harsh_accel, curr_sudden_brake)

        prev_state = encode_state(prev_weighted)
        curr_state = encode_state(curr_weighted)

        action = self.best_action(prev_state)
        reward = compute_reward(prev_weighted, curr_weighted, action)

        self.update(prev_state, action, reward, curr_state)
        self.save()

        return {
            "reward":              round(reward, 3),
            "updated":             True,
            "action":              TIERS[action],
            "prev_weighted":       round(prev_weighted, 2),
            "curr_weighted":       round(curr_weighted, 2),
            "prev_state":          prev_state,
            "curr_state":          curr_state,
        }
