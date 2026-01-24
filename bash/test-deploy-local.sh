#!/bin/bash

# Stage 1 Local Testing for deploy-app.sh
# Runs deploy-app.sh inside a container with mounted Docker socket

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="/opt/myapp"

# Clean up - use actual /opt/myapp for testing
if [ -d "$DEPLOY_ROOT" ]; then
  sudo rm -rf "$DEPLOY_ROOT"
fi
sudo mkdir -p "$DEPLOY_ROOT"
sudo chown -R $(whoami):$(whoami) "$DEPLOY_ROOT"

# Build locally
cd "$(dirname "$SCRIPT_DIR")"
npm run build

# Run in container
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$DEPLOY_ROOT":/opt/myapp \
  -v "$SCRIPT_DIR/deploy-app.sh":/deploy-app.sh \
  -v "$(pwd)":/host \
  -e DEPLOY_ROOT=/opt/myapp \
  -e REPO_OWNER=dominic-ks \
  -e REPO_NAME=iot-nest-firmware \
  -e DOCKERPROFILES=app \
  -e LOCAL_BUILD=1 \
  alpine sh -c "
    apk add --no-cache curl bash docker docker-compose &&
    mkdir -p /root/.config/device &&
    echo 'DOCKERPROFILES=app' > /root/.config/device/.env &&
    mkdir -p /opt/myapp/next &&
    cp -r /host/dist /opt/myapp/next/ &&
    cp -r /host/node_modules /opt/myapp/next/ &&
    cp /host/docker-compose.yml /opt/myapp/next/ &&
    cp /host/bash/setup-python.sh /opt/myapp/next/ &&
    chmod +x /deploy-app.sh &&
    /deploy-app.sh
  "