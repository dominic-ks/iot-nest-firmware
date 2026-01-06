#!/bin/bash
# Apply provisioning flake

# Source Nix (for single-user install)
. ~/.nix-profile/etc/profile.d/nix.sh

# Enter flake
# nix develop  # Removed as it may be causing issues

# Install packages
echo "Installing base packages..."
nix profile install nixpkgs#nodejs nixpkgs#yarn nixpkgs#python3 nixpkgs#git nixpkgs#vim nixpkgs#gcc nixpkgs#gnumake nixpkgs#docker nixpkgs#docker-compose

# Setup Docker group
echo "Setting up Docker group..."
sudo groupadd -f docker
sudo usermod -aG docker dominicks

# Start Docker daemon
echo "Starting Docker daemon..."
sudo ~/.nix-profile/bin/dockerd &

if [ -f ~/iot-nest-firmware/package.json ]; then
  echo "Installing node_modules..."
  cd ~/iot-nest-firmware && npm install --omit-dev && cd ~/os-provisioning
fi

echo "Building and installing iot-app..."
if nix build --impure .#iot-app; then
  nix profile install ./result
  echo "Installation successful."
else
  echo "Failed to build iot-app. Check for errors above."
  exit 1
fi

# Create systemd service
echo "Creating systemd service..."
IOT_APP_PATH=$(readlink result)/bin/iot-app
sudo tee /etc/systemd/system/iot-nest-firmware.service > /dev/null <<EOF
[Unit]
Description=IoT Nest Firmware Service
After=network.target

[Service]
ExecStart=$IOT_APP_PATH
Restart=always
User=dominicks

[Install]
WantedBy=multi-user.target
EOF

# Reload and start service
sudo systemctl daemon-reload
sudo systemctl enable iot-nest-firmware
sudo systemctl start iot-nest-firmware

echo "Service started. Check status with: sudo systemctl status iot-nest-firmware"
echo "View logs with: journalctl -u iot-nest-firmware"

# Check if DOCKERPROFILES contains "mqtt" and start docker services
echo "Checking DOCKERPROFILES for mqtt..."
if [ -f ~/iot-nest-firmware/.env ]; then
    DOCKERPROFILES=$(grep '^DOCKERPROFILES=' ~/iot-nest-firmware/.env | cut -d'=' -f2)
    if [[ $DOCKERPROFILES == *"mqtt"* ]]; then
        echo "DOCKERPROFILES contains 'mqtt'. Starting docker services..."
        if [ -f ~/iot-nest-firmware/bash/docker-runner.sh ]; then
            cd ~/iot-nest-firmware && ./bash/docker-runner.sh
        else
            echo "docker-runner.sh not found."
        fi
    else
        echo "DOCKERPROFILES does not contain 'mqtt'. Skipping docker services."
    fi
else
    echo ".env file not found. Skipping docker services."
fi

# Or apply profiles
# nix profile install .#base
# nix profile install .#node
# nix profile install .#iot-app

echo "Provisioning applied."