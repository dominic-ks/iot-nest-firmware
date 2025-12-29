#!/bin/bash
# Copy os-provisioning and built app dist to VM

set -e

# Load environment variables
source .env.gcloud-test

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Not authenticated with gcloud. Please run 'gcloud auth login'."
    exit 1
fi

# Copy os-provisioning
echo "Copying os-provisioning to VM..."
gcloud compute scp --recurse --zone=$ZONE ../os-provisioning iot-rpi-dev-box:~/ --compress

echo "Copying scripts to VM..."
gcloud compute scp --zone=$ZONE apply.sh iot-rpi-dev-box:~/os-provisioning/scripts/
gcloud compute scp --zone=$ZONE bootstrap-nix.sh iot-rpi-dev-box:~/os-provisioning/scripts/

# Create directories on VM
echo "Creating directories on VM..."
gcloud compute ssh iot-rpi-dev-box --zone=$ZONE --command="mkdir -p ~/iot-nest-firmware/dist"

# Copy dist (assuming built locally)
if [ -d "../dist" ]; then
    echo "Copying dist to VM..."
    gcloud compute scp --recurse --zone=$ZONE ../dist/* iot-rpi-dev-box:~/iot-nest-firmware/dist --compress
    if [ -f "../package.json" ]; then
        echo "Copying package.json to VM..."
        gcloud compute scp --zone=$ZONE ../package.json iot-rpi-dev-box:~/iot-nest-firmware/
    fi
    if [ -f "../package-lock.json" ]; then
        echo "Copying package-lock.json to VM..."
        gcloud compute scp --zone=$ZONE ../package-lock.json iot-rpi-dev-box:~/iot-nest-firmware/
    fi
    if [ -f "../.env" ]; then
        echo "Copying .env to VM..."
        gcloud compute scp --zone=$ZONE ../.env iot-rpi-dev-box:~/iot-nest-firmware/
    else
        echo "Warning: ../.env not found. The app may need environment variables."
    fi
else
    echo "Warning: ../dist not found. Build the app first with 'npm run build'."
fi

echo "Copy complete."