# start.py
# Run this from the project root before starting Expo.
# It auto-detects your current Wi-Fi IP, updates .env,
# then launches the RL model (app.py) in the background.

import socket
import subprocess
import sys
import os

ENV_FILE = os.path.join(os.path.dirname(__file__), '.env')
RL_ENV_KEY = 'EXPO_PUBLIC_RL_API_URL'
PORT = 5002

# ── 1. Detect current local IP ──────────────────────────────────────────────
def get_local_ip():
    try:
        # Trick: connect to a public address to find the outbound interface
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

# ── 2. Update .env ───────────────────────────────────────────────────────────
def update_env(ip: str):
    new_url = f'http://{ip}:{PORT}'
    
    lines = []
    replaced = False
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, 'r') as f:
            lines = f.readlines()
    
    for i, line in enumerate(lines):
        if line.startswith(f'{RL_ENV_KEY}='):
            lines[i] = f'{RL_ENV_KEY}={new_url}\n'
            replaced = True
            break
    
    if not replaced:
        lines.append(f'{RL_ENV_KEY}={new_url}\n')
    
    with open(ENV_FILE, 'w') as f:
        f.writelines(lines)
    
    return new_url

# ── 3. Main ──────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    ip = get_local_ip()
    url = update_env(ip)
    
    print(f'✅ Detected IP : {ip}')
    print(f'✅ .env updated: {RL_ENV_KEY}={url}')
    print()
    print('🚀 Starting RL Model (app.py)...')
    print('   Press Ctrl+C to stop.\n')
    
    rl_dir = os.path.join(os.path.dirname(__file__), 'rl_model')
    
    # Auto-detect virtual environment python
    venv_python = os.path.join(os.path.dirname(__file__), 'backend', 'venv', 'bin', 'python3')
    python_exe = venv_python if os.path.exists(venv_python) else sys.executable
    
    print(f'   Using Python: {python_exe}')
    subprocess.run([python_exe, 'app.py'], cwd=rl_dir)
