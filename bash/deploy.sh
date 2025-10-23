#!/bin/bash

set -e

echo "🚀 Starting IoT Nest Firmware Deployment..."

# Step 1: Pull latest code
echo "📥 Pulling latest code..."
git pull

# Step 2: Authenticate with Google Cloud Registry
echo "🔐 Authenticating with Google Cloud Registry..."
gcloud auth application-default print-access-token | docker login -u oauth2accesstoken --password-stdin https://europe-west2-docker.pkg.dev

# Step 3: Pull latest Docker image  
echo "🐳 Pulling latest Docker image..."
docker pull europe-west2-docker.pkg.dev/iot-projects-309015/iot-nest-firmware/bdvs/iot-nest-firmware:latest

# Step 4: Setup Python environment on host (for GPIO access)
echo "🐍 Setting up Python environment..."
bash/setup-python.sh

# Step 5: Verify requirements
echo "✅ Verifying setup..."
if [ -d "python-venv" ]; then
    echo "   ✓ Python virtual environment ready"
else
    echo "   ❌ Python virtual environment missing"
    exit 1
fi

if [ -d "src/python" ]; then
    echo "   ✓ Python source files available"
    echo "   Files: $(ls src/python/)"
else
    echo "   ❌ Python source files missing"
    exit 1
fi

# Step 6: Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down || true

# Step 7: Start new containers
echo "🚀 Starting updated containers..."
bash/docker-runner.sh

echo "✅ Deployment complete!"