#!/bin/bash
# retrain_cron.sh
# This script should be run at midnight via cron to process the PREVIOUS DAY's data.

# 1. Get yesterday's date formatted as YYYY.MM.DD (e.g., 2026.03.01)
# On macOS (BSD date), the syntax is `date -v-1d`
# On Linux (GNU date), the syntax is `date -d "yesterday"`
if date --version >/dev/null 2>&1; then
    YESTERDAY=$(date -d "yesterday" +%Y.%m.%d)
else
    YESTERDAY=$(date -v-1d +%Y.%m.%d)
fi

FILE_NAME="${YESTERDAY}.json"
FILE_PATH="/Users/lahiruasiri/Desktop/SmartBusApp/dataset/${FILE_NAME}"

echo "======================================================"
echo "Starting nightly retraining at $(date)"
echo "Looking for dataset: $FILE_PATH"

if [ ! -f "$FILE_PATH" ]; then
    echo "ERROR: File $FILE_PATH does not exist. Skipping retraining."
    exit 1
fi

echo "File found. Sending POST request to local Flask server for retraining..."

# Send the specific file path to the API for incremental parsing and training
RESPONSE=$(curl -s -X POST http://localhost:5001/api/retrain \
    -H "Content-Type: application/json" \
    -d "{\"file_path\": \"$FILE_PATH\"}")

echo "API Response: $RESPONSE"
echo "Nightly retraining script completed."
echo "======================================================"
