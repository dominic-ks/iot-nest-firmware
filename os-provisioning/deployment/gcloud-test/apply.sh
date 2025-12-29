#!/bin/bash
# Apply provisioning flake

# Source Nix (for single-user install)
. ~/.nix-profile/etc/profile.d/nix.sh

# Enter flake
# nix develop  # Removed as it may be causing issues

# Install packages
echo "Installing base packages..."
nix profile install nixpkgs#nodejs nixpkgs#yarn nixpkgs#python3 nixpkgs#git nixpkgs#vim nixpkgs#gcc nixpkgs#gnumake

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

# Or apply profiles
# nix profile install .#base
# nix profile install .#node
# nix profile install .#iot-app

echo "Provisioning applied."