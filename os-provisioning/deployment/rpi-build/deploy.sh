#!/bin/bash

# Load environment variables
source .env.rpi-build

# Check if IP and USER are set
if [ -z "$RPI_IP" ] || [ -z "$RPI_USER" ]; then
  echo "Please set RPI_IP and RPI_USER in .env.rpi-build"
  exit 1
fi

# Prompt for password
read -s -p "Enter password for $RPI_USER@$RPI_IP: " PASSWORD
echo

# Export for sshpass
export SSHPASS=$PASSWORD

# Function to run ssh commands
ssh_cmd() {
  sshpass -e ssh -o StrictHostKeyChecking=no $RPI_USER@$RPI_IP "$1"
}

# Function to copy files
scp_cmd() {
  sshpass -e scp -o StrictHostKeyChecking=no -r $1 $RPI_USER@$RPI_IP:$2
}

# Create directories on RPi
echo "Creating directories on RPi..."
ssh_cmd "mkdir -p ~/iot-nest-firmware/dist"

# Copy dist (assuming built locally)
if [ -d "../../../dist" ]; then
    echo "Copying dist to RPi..."
    scp_cmd "../../../dist/*" "~/iot-nest-firmware/dist/"
    if [ -f "../../../package.json" ]; then
        echo "Copying package.json to RPi..."
        scp_cmd "../../../package.json" "~/iot-nest-firmware/"
    fi
    if [ -f "../../../package-lock.json" ]; then
        echo "Copying package-lock.json to RPi..."
        scp_cmd "../../../package-lock.json" "~/iot-nest-firmware/"
    fi
    if [ -f "../../../.env" ]; then
        echo "Copying .env to RPi..."
        scp_cmd "../../../.env" "~/iot-nest-firmware/"
    else
        echo "Warning: ../../../.env not found. The app may need environment variables."
    fi
else
    echo "Warning: ../../../dist not found. Build the app first with 'npm run build'."
    exit 1
fi

# Install dependencies and start
echo "Installing dependencies..."
ssh_cmd "cd ~/iot-nest-firmware && npm install --production"

echo "Starting the application..."
ssh_cmd "cd ~/iot-nest-firmware && npm run start:prod"

echo "Deployment complete."