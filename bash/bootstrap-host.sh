#!/bin/bash

set -e

# bootstrap-host.sh - Set up host for IoT deployment
# Run once on fresh RPi/VM

DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/myapp}"

echo "Installing Docker..."

# Install Docker (for Raspberry Pi OS / Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Start and enable Docker
systemctl enable docker
systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER

echo "Creating deploy directory..."
sudo mkdir -p "$DEPLOY_ROOT"
sudo chown "$USER":"$USER" "$DEPLOY_ROOT"

# Optional: Set up cron for periodic updates
# Uncomment to enable
# echo "Setting up cron job for updates..."
# (crontab -l ; echo "0 * * * * $DEPLOY_ROOT/current/deploy-app.sh") | crontab -

echo "Bootstrap complete!"
echo "To apply docker group changes, run: newgrp docker"
echo "Or log out and back in, then run deploy-app.sh to deploy the app."