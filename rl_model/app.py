# rl_model/app.py
# Flask REST API for Q-Learning Driver Reward System
#
# Simplified API: all endpoints now only need raw violation counts:
#   - speeding     (int): number of speeding events
#   - harsh_accel  (int): number of harsh acceleration events  (10 = 1 violation)
#   - sudden_brake (int): number of sudden braking events      (10 = 1 violation)

from flask import Flask, request, jsonify
from flask_cors import CORS
from rl_agent import QLearningAgent

app   = Flask(__name__)
CORS(app)

# Single global agent — Q-table is loaded from disk on startup
agent = QLearningAgent(alpha=0.1, gamma=0.9, epsilon=0.1)


# ─── Health check ─────────────────────────────────────────────────────────────
@app.route('/', methods=['GET'])
def health():
    return jsonify({
        "status":  "running",
        "model":   "Q-Learning Reinforcement Learning (Simplified)",
        "q_table": f"{len(agent.q_table)} entries",
        "version": "2.0.0",
        "scoring": "score = max(0, 100 - weighted_violations * 5)",
        "weights": "speeding=1pt, harsh_accel=0.1pt each, sudden_brake=0.1pt each"
    })


# ─── Predict tier for a driver ─────────────────────────────────────────────────
# POST /predict-tier
# Body: { "speeding": 2, "harsh_accel": 15, "sudden_brake": 8 }
#
# weighted_violations = speeding + harsh_accel/10 + sudden_brake/10
# score = max(0, 100 - weighted_violations * 5)
@app.route('/predict-tier', methods=['POST'])
def predict_tier():
    try:
        data = request.get_json()

        speeding     = int(data.get('speeding', 0))
        harsh_accel  = int(data.get('harsh_accel', 0))
        sudden_brake = int(data.get('sudden_brake', 0))

        result = agent.predict(speeding, harsh_accel, sudden_brake)
        result['success'] = True
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


# ─── Learn from a real IoT driving session ─────────────────────────────────────
# POST /learn
# Body: {
#   "prev_speeding": 3, "prev_harsh_accel": 20, "prev_sudden_brake": 10,
#   "curr_speeding": 1, "curr_harsh_accel": 8,  "curr_sudden_brake": 5
# }
@app.route('/learn', methods=['POST'])
def learn():
    """
    Called after each real driving session.
    Updates the Q-table based on driver improvement or decline.
    """
    try:
        data = request.get_json()

        result = agent.learn_from_session(
            prev_speeding     = int(data.get('prev_speeding', 0)),
            prev_harsh_accel  = int(data.get('prev_harsh_accel', 0)),
            prev_sudden_brake = int(data.get('prev_sudden_brake', 0)),
            curr_speeding     = int(data.get('curr_speeding', 0)),
            curr_harsh_accel  = int(data.get('curr_harsh_accel', 0)),
            curr_sudden_brake = int(data.get('curr_sudden_brake', 0)),
        )
        result['success'] = True
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


# ─── Batch predict (admin leaderboard) ─────────────────────────────────────────
# POST /predict-batch
# Body: { "drivers": [
#   { "driver_id": "D001", "speeding": 2, "harsh_accel": 15, "sudden_brake": 8 }
# ]}
@app.route('/predict-batch', methods=['POST'])
def predict_batch():
    try:
        drivers = request.get_json().get('drivers', [])
        results = []

        for d in drivers:
            r = agent.predict(
                speeding     = int(d.get('speeding', 0)),
                harsh_accel  = int(d.get('harsh_accel', 0)),
                sudden_brake = int(d.get('sudden_brake', 0)),
            )
            r['driver_id'] = d.get('driver_id')
            results.append(r)

        # Rank by safety score descending
        results.sort(key=lambda x: x['safety_score'], reverse=True)
        for i, r in enumerate(results):
            r['rank'] = i + 1

        return jsonify({"success": True, "results": results})

    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


if __name__ == '__main__':
    print("🚀 RL Reward API v2.0 running on http://localhost:5002")
    print("📊 Scoring: score = max(0, 100 - weighted_violations * 5)")
    print("⚖️  Weights: speeding=1, harsh_accel/10=1, sudden_brake/10=1")
    app.run(host='0.0.0.0', port=5002, debug=True)
