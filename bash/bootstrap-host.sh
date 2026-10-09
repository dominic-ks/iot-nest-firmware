#!/bin/bash

set -e

# bootstrap-host.sh - Set up host for IoT deployment
# Run once on a fresh RPi/VM as the device user, with sudo:
#   sudo bash bootstrap-host.sh
# Safe to re-run.

if [ "$(id -u)" -ne 0 ]; then
    echo "Run with sudo: sudo bash $0" >&2
    exit 1
fi

DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/myapp}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEVICE_USER="${SUDO_USER:-$USER}"
DEVICE_HOME="$(getent passwd "$DEVICE_USER" | cut -d: -f6)"

echo "Installing packages..."
apt-get update
apt-get install -y curl python3-venv

if ! command -v docker >/dev/null 2>&1; then
    echo "Installing Docker..."
    # Install Docker (for Raspberry Pi OS / Ubuntu)
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh
    rm /tmp/get-docker.sh
fi

# Start and enable Docker
systemctl enable docker
systemctl start docker

# Add the device user to the docker group
usermod -aG docker "$DEVICE_USER"

echo "Creating deploy directory..."
mkdir -p "$DEPLOY_ROOT"
chown "$DEVICE_USER":"$DEVICE_USER" "$DEPLOY_ROOT"

echo "Enabling DHT22 kernel driver on GPIO4..."
BOOT_CONFIG=/boot/firmware/config.txt
[ -f "$BOOT_CONFIG" ] || BOOT_CONFIG=/boot/config.txt
if [ -f "$BOOT_CONFIG" ] && ! grep -q "^dtoverlay=dht11" "$BOOT_CONFIG"; then
    echo "dtoverlay=dht11,gpiopin=4" >> "$BOOT_CONFIG"
    echo "DHT22 overlay added; reboot required before readings are available."
fi

# Raspberry Pi OS defaults to a 2GB swap file on top of zram; keep it small on SD cards.
SWAP_CONFIG=/etc/rpi/swap.conf
if [ -f "$SWAP_CONFIG" ] && ! grep -q "^MaxSizeMiB=" "$SWAP_CONFIG"; then
    echo "Limiting swap file to 512MB..."
    sed -i '/^\[File\]/a MaxSizeMiB=512' "$SWAP_CONFIG"
fi

if [ -f "$DEVICE_HOME/.ssh/id_rsa" ]; then
    echo "Configuring reverse SSH tunnel..."
    "$SCRIPT_DIR/setup-reverse-ssh.sh"
else
    echo "Skipping reverse SSH tunnel: $DEVICE_HOME/.ssh/id_rsa not found (restore it and re-run to enable)."
fi

echo "Bootstrap complete!"
echo "Next steps:"
echo "  1. Make sure $DEVICE_HOME/.config/device/.env exists (see .env-example)."
echo "  2. Reboot (applies the docker group, DHT22 overlay and swap size)."
echo "  3. As $DEVICE_USER, run: bash $SCRIPT_DIR/deploy-app.sh"
echo "     It installs the latest release and adds the update cron jobs."
