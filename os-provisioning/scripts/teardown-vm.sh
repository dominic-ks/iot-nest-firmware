#!/bin/bash
# Tear down GCP VM for IoT RPi development

set -e

# Load environment variables
source .env

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "gcloud CLI is not installed."
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Confirm deletion
read -p "Are you sure you want to delete VM $VM_NAME in project $PROJECT_ID? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Aborted."
    exit 0
fi

# Delete the VM
echo "Deleting VM $VM_NAME..."
gcloud compute instances delete $VM_NAME --zone=$ZONE --quiet

echo "VM $VM_NAME deleted."