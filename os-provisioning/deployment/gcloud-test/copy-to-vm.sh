#!/bin/bash
# Copy os-provisioning and built app dist to VM

set -e

# Load environment variables
source "$(dirname "$0")/.env.gcloud-test"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Not authenticated with gcloud. Please run 'gcloud auth login'."
    exit 1
fi

# Copy os-provisioning
echo "Copying os-provisioning to VM..."
gcloud compute scp --recurse --zone=$ZONE "$(cd "$(dirname "$0")/../.." && pwd)/" $VM_NAME:'~/os-provisioning' --compress

# Make scripts executable
echo "Making scripts executable on VM..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command='chmod +x ~/os-provisioning/deployment/gcloud-test/*.sh'


# Create directories on VM
echo "Creating directories on VM..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command='mkdir -p ~/iot-nest-firmware/dist'

# Copy dist (assuming built locally)
if [ -d "$(cd "$(dirname "$0")/../../.." && pwd)/dist" ]; then
    echo "Copying dist to VM..."
    gcloud compute scp --recurse --zone=$ZONE "$(cd "$(dirname "$0")/../../.." && pwd)/dist/" $VM_NAME:'~/iot-nest-firmware/' --compress
    if [ -f "$(cd "$(dirname "$0")/../../.." && pwd)/package.json" ]; then
        echo "Copying package.json to VM..."
        gcloud compute scp --zone=$ZONE "$(cd "$(dirname "$0")/../../.." && pwd)/package.json" $VM_NAME:'~/iot-nest-firmware/'
    fi
    if [ -f "$(cd "$(dirname "$0")/../../.." && pwd)/package-lock.json" ]; then
        echo "Copying package-lock.json to VM..."
        gcloud compute scp --zone=$ZONE "$(cd "$(dirname "$0")/../../.." && pwd)/package-lock.json" $VM_NAME:'~/iot-nest-firmware/'
    fi
    if [ -f "$(cd "$(dirname "$0")/../../.." && pwd)/.env" ]; then
        echo "Copying .env to VM..."
        gcloud compute scp --zone=$ZONE "$(cd "$(dirname "$0")/../../.." && pwd)/.env" $VM_NAME:'~/iot-nest-firmware/'
    else
        echo "Warning: ../.env not found. The app may need environment variables."
    fi
else
    echo "Warning: ../dist not found. Build the app first with 'npm run build'."
fi

# Copy docker-compose.yml
if [ -f "$(cd "$(dirname "$0")/../../.." && pwd)/docker-compose.yml" ]; then
    echo "Copying docker-compose.yml to VM..."
    gcloud compute scp --zone=$ZONE "$(cd "$(dirname "$0")/../../.." && pwd)/docker-compose.yml" $VM_NAME:'~/iot-nest-firmware/'
fi

# Copy bash directory
if [ -d "$(cd "$(dirname "$0")/../../.." && pwd)/bash" ]; then
    echo "Copying bash directory to VM..."
    gcloud compute scp --recurse --zone=$ZONE "$(cd "$(dirname "$0")/../../.." && pwd)/bash/" $VM_NAME:'~/iot-nest-firmware/' --compress
fi

# Create zigbee2mqtt config directory on VM
echo "Creating zigbee2mqtt config directory on VM..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command='mkdir -p ~/.config/zigbee2mqtt/zigbee2mqtt-data'

# Copy zigbee2mqtt configuration
if [ -f "$(cd "$(dirname "$0")/../../.." && pwd)/zigbee2mqtt-configuration-example.yaml" ]; then
    echo "Copying zigbee2mqtt configuration to VM..."
    gcloud compute scp --zone=$ZONE "$(cd "$(dirname "$0")/../../.." && pwd)/zigbee2mqtt-configuration-example.yaml" $VM_NAME:~/.config/zigbee2mqtt/zigbee2mqtt-data/configuration.yaml
fi

echo "Copy complete."