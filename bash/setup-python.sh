#!/bin/bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Keep the venv outside the release directory so deploys don't rebuild it each time.
VENV_DIR="${DHT22_VENV_DIR:-$HOME/.local/share/iot-device/python-venv}"
PYTHON_BIN=""
VENV_PYTHON=""
DEPENDENCY_STAMP_FILE="$VENV_DIR/.requirements-stamp"
PYTHON_SCRIPT="$APP_DIR/dist/python/get-dht22-reading.py"
if [ ! -f "$PYTHON_SCRIPT" ]; then
  PYTHON_SCRIPT="$APP_DIR/src/python/get-dht22-reading.py"
fi
OUTPUT_FILE="$APP_DIR/dht22_readings.json"
PID_FILE="$APP_DIR/.dht22-reader.pid"
LOG_FILE="$APP_DIR/dht22-reader.log"
START_ONLY="${1:-}"
CRON_CMD="@reboot bash \"$APP_DIR/bash/setup-python.sh\" --start-only"

pick_python_bin() {
  local candidate
  for candidate in python3 python3.13 python3.12 python3.11 python3.10 python3.9 python3.8; do
    if ! command -v "$candidate" >/dev/null 2>&1; then
      continue
    fi

    if "$candidate" -c 'import sys; raise SystemExit(0 if sys.version_info[:2] >= (3, 8) else 1)' >/dev/null 2>&1; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

build_dependency_stamp() {
  local requirements_hash
  requirements_hash="$(sha256sum "$APP_DIR/py-requirements.txt" | awk '{print $1}')"
  printf '%s|%s\n' "$PYTHON_BIN" "$requirements_hash"
}

venv_dependencies_ready() {
  [ -x "$VENV_PYTHON" ] || return 1
  [ -f "$DEPENDENCY_STAMP_FILE" ] || return 1
  [ "$(cat "$DEPENDENCY_STAMP_FILE")" = "$(build_dependency_stamp)" ] || return 1
  "$VENV_PYTHON" -c 'import dotenv' >/dev/null 2>&1
}

if ! PYTHON_BIN="$(pick_python_bin)"; then
  echo "A compatible Python runtime is required but was not found."
  echo "Python 3.8 or newer is required. Install prerequisites and rerun:"
  echo "  sudo apt-get update && sudo apt-get install -y python3 python3-venv"
  exit 1
fi

if [ ! -f "$PYTHON_SCRIPT" ]; then
  echo "Missing $PYTHON_SCRIPT"
  exit 1
fi

if [ -x "$VENV_DIR/bin/python" ]; then
  if ! "$VENV_DIR/bin/python" -c 'import sys; raise SystemExit(0 if sys.version_info[:2] >= (3, 8) else 1)' >/dev/null 2>&1; then
    if [ "$START_ONLY" = "--start-only" ]; then
      echo "Existing virtualenv uses an unsupported Python version. Rerun without --start-only after installing Python 3.8 or newer."
      exit 1
    fi

    rm -rf "$VENV_DIR"
  fi
fi

VENV_PYTHON="$VENV_DIR/bin/python"

if [ "$START_ONLY" != "--start-only" ]; then
  if [ ! -f "$APP_DIR/py-requirements.txt" ]; then
    echo "Missing $APP_DIR/py-requirements.txt"
    exit 1
  fi

  if [ ! -x "$VENV_PYTHON" ]; then
    mkdir -p "$(dirname "$VENV_DIR")"
    "$PYTHON_BIN" -m venv "$VENV_DIR"
    VENV_PYTHON="$VENV_DIR/bin/python"
  fi

  if ! venv_dependencies_ready; then
    "$VENV_PYTHON" -m pip install --upgrade pip

    "$VENV_PYTHON" -m pip install -r "$APP_DIR/py-requirements.txt"
    build_dependency_stamp > "$DEPENDENCY_STAMP_FILE"
  fi

  CURRENT_CRON="$(crontab -l 2>/dev/null || true)"
  if ! printf '%s\n' "$CURRENT_CRON" | grep -Fq "$CRON_CMD"; then
    (printf '%s\n' "$CURRENT_CRON"; printf '%s\n' "$CRON_CMD") | sed '/^$/d' | crontab -
    echo "Added reboot cron entry for DHT22 reader"
  fi
fi

if [ -f "$PID_FILE" ] && ps -p "$(cat "$PID_FILE")" >/dev/null 2>&1; then
  echo "DHT22 reader already running with PID $(cat "$PID_FILE")"
  exit 0
fi

# Drop NODE_ENV: deploy-app.sh exports the device .env, and development mode makes the reader fake its values.
nohup env -u NODE_ENV DHT22_OUTPUT_FILE="$OUTPUT_FILE" "$VENV_DIR/bin/python" "$PYTHON_SCRIPT" >> "$LOG_FILE" 2>&1 &
READER_PID=$!
echo "$READER_PID" > "$PID_FILE"

echo "Started DHT22 reader (PID $READER_PID)"
echo "Output file: $OUTPUT_FILE"