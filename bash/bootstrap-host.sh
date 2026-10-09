#!/bin/bash

set -e

# bootstrap-host.sh - Set up host for IoT deployment
# Run once on fresh RPi/VM

DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/myapp}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

echo "Enabling DHT22 kernel driver on GPIO4..."
BOOT_CONFIG=/boot/firmware/config.txt
[ -f "$BOOT_CONFIG" ] || BOOT_CONFIG=/boot/config.txt
if [ -f "$BOOT_CONFIG" ] && ! grep -q "^dtoverlay=dht11" "$BOOT_CONFIG"; then
    echo "dtoverlay=dht11,gpiopin=4" | sudo tee -a "$BOOT_CONFIG" >/dev/null
    echo "DHT22 overlay added; reboot required before readings are available."
fi

echo "Configuring reverse SSH tunnel..."
"$SCRIPT_DIR/setup-reverse-ssh.sh"

# Optional: Set up cron for periodic updates
# Uncomment to enable
# echo "Setting up cron job for updates..."
# (crontab -l ; echo "0 * * * * $DEPLOY_ROOT/current/deploy-app.sh") | crontab -

echo "Bootstrap complete!"
echo "To apply docker group changes, run: newgrp docker"
echo "Or log out and back in, then run deploy-app.sh to deploy the app."