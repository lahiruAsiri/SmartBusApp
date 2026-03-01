# rl_model/app.py
# Flask REST API for Q-Learning Driver Reward System

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
        "model":   "Q-Learning Reinforcement Learning",
        "q_table": f"{len(agent.q_table)} entries",
        "version": "1.0.0"
    })


# ─── Predict tier for a driver ─────────────────────────────────────────────────
# POST /predict-tier
# Body: { "violations": 5, "safe_days": 30, "avg_speed_over": 10 }
@app.route('/predict-tier', methods=['POST'])
def predict_tier():
    try:
        data = request.get_json()
        for field in ['violations', 'safe_days', 'avg_speed_over']:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        result = agent.predict(
            violations     = int(data['violations']),
            safe_days      = int(data['safe_days']),
            avg_speed_over = float(data['avg_speed_over']),
        )
        result['success'] = True
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


# ─── Learn from a real IoT driving session ─────────────────────────────────────
# POST /learn
# Body: { "prev_violations":4, "prev_safe_days":10, "prev_speed_over":12,
#         "curr_violations":2, "curr_safe_days":17, "curr_speed_over":6 }
@app.route('/learn', methods=['POST'])
def learn():
    """
    Called after each real driving session.
    Updates the Q-table using the driver's actual improvement or decline.
    This is what makes the model 'learn' from 1 IoT device over time.
    """
    try:
        data = request.get_json()
        required = ['prev_violations', 'prev_safe_days', 'prev_speed_over',
                    'curr_violations', 'curr_safe_days', 'curr_speed_over']
        for field in required:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        result = agent.learn_from_session(
            prev_violations  = int(data['prev_violations']),
            prev_safe_days   = int(data['prev_safe_days']),
            prev_speed_over  = float(data['prev_speed_over']),
            curr_violations  = int(data['curr_violations']),
            curr_safe_days   = int(data['curr_safe_days']),
            curr_speed_over  = float(data['curr_speed_over']),
        )
        result['success'] = True
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


# ─── Batch predict (leaderboard) ───────────────────────────────────────────────
# POST /predict-batch
# Body: { "drivers": [{ "driver_id": "D001", "violations":2, "safe_days":60, "avg_speed_over":3 }] }
@app.route('/predict-batch', methods=['POST'])
def predict_batch():
    try:
        drivers = request.get_json().get('drivers', [])
        results = []
        for d in drivers:
            r = agent.predict(
                violations     = int(d.get('violations', 0)),
                safe_days      = int(d.get('safe_days', 0)),
                avg_speed_over = float(d.get('avg_speed_over', 0)),
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
    print("🚀 RL Reward API running on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
