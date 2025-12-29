#!/bin/bash
# Bootstrap Nix on Raspberry Pi OS

# Install Nix
curl -L https://nixos.org/nix/install | sh -s -- --yes

# Source Nix
. ~/.nix-profile/etc/profile.d/nix.sh

# Enable flakes
mkdir -p ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf

echo "Nix installed and flakes enabled."