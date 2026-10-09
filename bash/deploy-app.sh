#!/bin/bash

set -e

# Verify architecture
ARCH=$(uname -m)
if [ "$ARCH" != "aarch64" ] && [ "$ARCH" != "arm64" ]; then
    echo "Warning: This deployment is built for ARM64, but system is $ARCH"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Load device configuration
if [ -f ~/.config/device/.env ]; then
    export $(egrep -v '^#' ~/.config/device/.env | xargs)
fi

# Configuration
REPO_OWNER="dominic-ks"  # Replace with actual owner
REPO_NAME="iot-nest-firmware"      # Replace with actual repo name
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/myapp}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"  # Optional, for private repos

# Ensure DEPLOY_ROOT exists
mkdir -p "$DEPLOY_ROOT"

cd "$DEPLOY_ROOT"

# Function to get latest release info
get_latest_release() {
    local api_url="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/latest"
    if [ -n "$GITHUB_TOKEN" ]; then
        curl -H "Authorization: token $GITHUB_TOKEN" -s "$api_url"
    else
        curl -s "$api_url"
    fi
}

# Function to download and unpack release
download_and_unpack() {
    local download_url="$1"
    local target_dir="$2"
    
    mkdir -p "$target_dir"
    cd "$target_dir"
    
    echo "Downloading from $download_url"
    if [ -n "$GITHUB_TOKEN" ]; then
        curl -L -H "Authorization: token $GITHUB_TOKEN" -o app.tar.gz "$download_url"
    else
        curl -L -o app.tar.gz "$download_url"
    fi
    
    echo "Unpacking..."
    tar -xzf app.tar.gz
    rm app.tar.gz
}

# Main logic
echo "Checking for updates..."

LATEST_RELEASE_JSON=$(get_latest_release)
LATEST_TAG=$(echo "$LATEST_RELEASE_JSON" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')

if [ "$LOCAL_BUILD" = "1" ]; then
    LATEST_TAG="local"
fi

if [ -z "$LATEST_TAG" ] && [ "$LOCAL_BUILD" != "1" ]; then
    echo "Failed to get latest release"
    exit 1
fi

CURRENT_TAG=""
if [ -f VERSION ]; then
    CURRENT_TAG=$(cat VERSION)
fi

echo "Current: $CURRENT_TAG"
echo "Latest: $LATEST_TAG"

if [ "$LATEST_TAG" = "$CURRENT_TAG" ] && [ "$LOCAL_BUILD" != "1" ]; then
    echo "Already up to date"
    exit 0
fi

# Get download URL for app.tar.gz
DOWNLOAD_URL=$(echo "$LATEST_RELEASE_JSON" | grep -A 50 '"assets"' | grep '"browser_download_url"' | grep 'app\.tar\.gz' | sed -E 's/.*"([^"]+)".*/\1/' | head -1)

if [ -z "$DOWNLOAD_URL" ]; then
    echo "No app.tar.gz found in latest release"
    exit 1
fi

echo "Deploying $LATEST_TAG"

if [ "$LOCAL_BUILD" = "1" ]; then
  # Files are mounted to next
  cd "$DEPLOY_ROOT/next"
else
  download_and_unpack "$DOWNLOAD_URL" "next"
fi

# Stop host-side reader from previous deployment if running.
if [ -f "$DEPLOY_ROOT/current/.dht22-reader.pid" ]; then
  OLD_DHT22_PID=$(cat "$DEPLOY_ROOT/current/.dht22-reader.pid")
  if ps -p "$OLD_DHT22_PID" >/dev/null 2>&1; then
    kill "$OLD_DHT22_PID" || true
  fi
fi

# Rotate directories
cd "$DEPLOY_ROOT"
rm -rf previous-2 2>/dev/null || true
if [ -d current ]; then
  [ -d previous ] && mv previous previous-2
  mv current previous
fi
mv next current

Z2M_CONFIG_DIR="$HOME/.config/zigbee2mqtt/zigbee2mqtt-data"
Z2M_CONFIG_FILE="$Z2M_CONFIG_DIR/configuration.yaml"
Z2M_EXAMPLE_FILE="$DEPLOY_ROOT/current/zigbee2mqtt-configuration-example.yaml"

if [ -f "$Z2M_EXAMPLE_FILE" ]; then
        mkdir -p "$Z2M_CONFIG_DIR"
        if [ ! -f "$Z2M_CONFIG_FILE" ]; then
                cp "$Z2M_EXAMPLE_FILE" "$Z2M_CONFIG_FILE"
                echo "Created Zigbee2MQTT config at $Z2M_CONFIG_FILE"
        fi
fi

# Build docker compose command with profiles
IFS='|' read -r -a array <<< "$DOCKERPROFILES"
COMMAND="docker compose -f $DEPLOY_ROOT/current/docker-compose.yml"

for ELEMENT in "${array[@]}"
do
    COMMAND="$COMMAND --profile $ELEMENT"
done

# Stop any existing containers first to ensure clean volume mount
$COMMAND down 2>/dev/null || true

# Attempt to start services
if $COMMAND up -d; then
    echo "Deployment successful"
    
    echo "$LATEST_TAG" > VERSION

    # Start the host-side DHT22 reader for the new release (the old one was stopped above).
    echo "Setting up DHT22 reader..."
    bash "$DEPLOY_ROOT/current/bash/setup-python.sh" || echo "Warning: DHT22 reader setup failed"

    # Check for updates hourly and shortly after boot (so a freshly flashed device catches up)
    SCRIPT_PATH="$DEPLOY_ROOT/current/bash/deploy-app.sh"
    LOG_REDIRECT='>> $HOME/deploy.log 2>&1'
    if ! crontab -l 2>/dev/null | grep -q "^0 \* \* \* \* $SCRIPT_PATH"; then
        (crontab -l 2>/dev/null; echo "0 * * * * $SCRIPT_PATH $LOG_REDIRECT") | crontab -
        echo "Added hourly cron job for updates"
    fi
    if ! crontab -l 2>/dev/null | grep -q "^@reboot sleep [0-9]* && $SCRIPT_PATH"; then
        (crontab -l 2>/dev/null; echo "@reboot sleep 120 && $SCRIPT_PATH $LOG_REDIRECT") | crontab -
        echo "Added on-boot cron job for updates"
    fi
else
    echo "Failed to start services, rolling back"
    # Rollback
    mv current next
    if [ -d previous ]; then
      mv previous current
      bash "$DEPLOY_ROOT/current/bash/setup-python.sh" --start-only || true
    fi
    exit 1
fi