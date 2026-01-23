#!/bin/bash

# Stage 1 Local Testing for deploy-app.sh
# Runs deploy-app.sh inside a container with mounted Docker socket

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)/test-staging"

# Clean up
if [ -d "$DEPLOY_ROOT" ]; then
  sudo rm -rf "$DEPLOY_ROOT"
fi
mkdir -p "$DEPLOY_ROOT"

# Run in container
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$DEPLOY_ROOT":/opt/myapp \
  -v "$SCRIPT_DIR/deploy-app.sh":/deploy-app.sh \
  -e DEPLOY_ROOT=/opt/myapp \
  -e REPO_OWNER=dominic-ks \
  -e REPO_NAME=iot-nest-firmware \
  -e DOCKERPROFILES=app \
  alpine sh -c "
    apk add --no-cache curl bash docker docker-compose &&
    mkdir -p /root/.config/device &&
    echo 'DOCKERPROFILES=app' > /root/.config/device/.env &&
    chmod +x /deploy-app.sh &&
    /deploy-app.sh
  "