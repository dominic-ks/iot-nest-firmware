#!/bin/bash
# Provision GCP VM for IoT RPi development

set -e

# Load environment variables
source .env.gcloud-test

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "gcloud CLI is not installed. Please install it first."
    exit 1
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Not authenticated with gcloud. Please run 'gcloud auth login'."
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Create the VM
echo "Creating VM $VM_NAME in project $PROJECT_ID..."
gcloud compute instances create $VM_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --boot-disk-size=$BOOT_DISK_SIZE \
    --tags=$TAGS

echo "VM created. Waiting for startup script to complete..."
sleep 60  # Adjust as needed

# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

echo "VM $VM_NAME is ready at $EXTERNAL_IP"

# Copy project files to VM
echo "Copying os-provisioning and app files to VM..."
./copy-to-vm.sh

# Run provisioning on VM
# echo "Running provisioning on VM..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command "cd ~/os-provisioning && ./scripts/bootstrap-nix.sh && ./scripts/apply.sh"

echo "Provisioning complete."
echo "To connect via SSH: gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "Or use VS Code Remote SSH with: ssh user@$EXTERNAL_IP"