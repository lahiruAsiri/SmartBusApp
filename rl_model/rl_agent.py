# rl_model/rl_agent.py
# Q-Learning Agent for Driver Reward System
#
# Uses a Q-table (dictionary) indexed by (state, action).
# Q-values are updated using the Bellman equation after each real driving session.
# The Q-table is persisted to q_table.json so it survives restarts.

import numpy as np
import json
import os
from rl_environment import (
    NUM_VIOLATION_STATES, NUM_SAFE_DAY_STATES,
    NUM_SPEED_STATES, NUM_ACTIONS, TIERS, TIER_CONFIG,
    encode_state, _score_from_state
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

        # Q-table: keys are "v_s_p_a" strings for JSON serialisability
        self.q_table: dict[str, float] = {}
        self._load()

    # ── persistence ──────────────────────────────────────────────────────────

    def _key(self, state: tuple, action: int) -> str:
        return f"{state[0]}_{state[1]}_{state[2]}_{action}"

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
        Pre-populate Q-table with expert knowledge so the agent starts smart.
        Without this, the agent would take many real sessions to become useful.
        
        Rule: low violations + many safe days + low speed → prefer higher tiers
        """
        print("🔄 Initialising Q-table with domain knowledge warm-up...")
        for v in range(NUM_VIOLATION_STATES):
            for s in range(NUM_SAFE_DAY_STATES):
                for p in range(NUM_SPEED_STATES):
                    state = (v, s, p)
                    # Compute an intuitive "ideal action" based on state
                    # v=0(low)..4(high), s=0(few)..4(many), p=0(minor)..4(severe)
                    ideal = round((s * 1.5 - v * 1.0 - p * 0.8) + 2)
                    ideal = max(0, min(4, ideal))

                    for a in range(NUM_ACTIONS):
                        # Q-value peaks at the ideal action, falls off for others
                        distance = abs(a - ideal)
                        q_val = 10.0 - (distance * 3.0)
                        self.set_q(state, a, q_val)

        self.save()
        print(f"✅ Q-table warm-up complete ({len(self.q_table)} entries saved)")

    # ── predict (inference) ───────────────────────────────────────────────────

    def predict(
        self,
        violations:    int,
        safe_days:     int,
        avg_speed_over: float,
    ) -> dict:
        """
        Given current driver stats, return the recommended tier.
        This is what the Flask API calls.
        """
        state  = encode_state(violations, safe_days, avg_speed_over)
        action = self.best_action(state)
        tier   = TIERS[action]
        score  = _score_from_state(state)

        # Compute Q-value distribution (confidence in each tier)
        q_values   = [self.get_q(state, a) for a in range(NUM_ACTIONS)]
        q_min, q_max = min(q_values), max(q_values)
        span = q_max - q_min if q_max != q_min else 1.0
        confidence = {TIERS[a]: round((q_values[a] - q_min) / span, 3) for a in range(NUM_ACTIONS)}

        return {
            "safety_score":  round(score, 1),
            "tier":          tier,
            "action_idx":    action,
            "points_earned": TIER_CONFIG[tier]['points'],
            "monthly_bonus": TIER_CONFIG[tier]['bonus'],
            "confidence":    confidence,
            "q_values":      {TIERS[a]: round(q_values[a], 3) for a in range(NUM_ACTIONS)},
            "state":         {"violation_bucket": state[0], "safe_day_bucket": state[1], "speed_bucket": state[2]},
        }

    # ── learn from real IoT session ───────────────────────────────────────────

    def learn_from_session(
        self,
        prev_violations:    int,
        prev_safe_days:     int,
        prev_speed_over:    float,
        curr_violations:    int,
        curr_safe_days:     int,
        curr_speed_over:    float,
    ) -> dict:
        """
        Called after each real driving session to update the Q-table.
        This is the core RL loop — the model learns from real IoT data over time.
        """
        from rl_environment import compute_reward

        prev_state = encode_state(prev_violations, prev_safe_days, prev_speed_over)
        curr_state = encode_state(curr_violations, curr_safe_days, curr_speed_over)

        # What action did we assign last session?
        action = self.best_action(prev_state)

        # Compute reward: did driver improve?
        reward = compute_reward(prev_violations, curr_violations, prev_safe_days, curr_safe_days, action)

        # Update Q-table with Bellman equation
        self.update(prev_state, action, reward, curr_state)
        self.save()

        return {
            "reward":    round(reward, 3),
            "updated":   True,
            "action":    TIERS[action],
            "prev_state": prev_state,
            "curr_state": curr_state,
        }
