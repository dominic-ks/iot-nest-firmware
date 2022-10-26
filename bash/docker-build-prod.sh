#!/bin/bash
docker build -f Dockerfile.App -t europe-west2-docker.pkg.dev/iot-projects-309015/iot-nest-firmware/bdvs/iot-nest-firmware:latest .
docker push europe-west2-docker.pkg.dev/iot-projects-309015/iot-nest-firmware/bdvs/iot-nest-firmware:latest