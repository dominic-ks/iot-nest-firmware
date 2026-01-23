#!/bin/bash

set -e

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
    
    # Set up Python venv on device
    if [ -f "setup-python.sh" ]; then
        echo "Setting up Python environment..."
        bash setup-python.sh
    fi
}

# Main logic
echo "Checking for updates..."

LATEST_RELEASE_JSON=$(get_latest_release)
echo "DEBUG: Release JSON (first 20 lines):"
echo "$LATEST_RELEASE_JSON" | head -20
LATEST_TAG=$(echo "$LATEST_RELEASE_JSON" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_TAG" ]; then
    echo "Failed to get latest release"
    exit 1
fi

CURRENT_TAG=""
if [ -f VERSION ]; then
    CURRENT_TAG=$(cat VERSION)
fi

echo "Current: $CURRENT_TAG"
echo "Latest: $LATEST_TAG"

if [ "$LATEST_TAG" = "$CURRENT_TAG" ]; then
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

# Download to next/
download_and_unpack "$DOWNLOAD_URL" "next"

# Build docker compose command with profiles
IFS='|' read -r -a array <<< "$DOCKERPROFILES"
COMMAND="docker compose -f $DEPLOY_ROOT/next/docker-compose.yml"

for ELEMENT in "${array[@]}"
do
    COMMAND="$COMMAND --profile $ELEMENT"
done

# Attempt to start services
if $COMMAND up -d; then
    echo "Deployment successful"
    
    # Rotate directories
    rm -rf previous-2 2>/dev/null || true
    [ -d previous ] && mv previous previous-2
    [ -d current ] && mv current previous
    mv next current
    
    echo "$LATEST_TAG" > VERSION
else
    echo "Failed to start services, cleaning up"
    rm -rf next
    exit 1
fi