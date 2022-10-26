#!/bin/bash
docker buildx build -f Dockerfile.App  --platform linux/amd64,linux/arm64 -t europe-west2-docker.pkg.dev/iot-projects-309015/iot-nest-firmware/bdvs/iot-nest-firmware:latest --push .