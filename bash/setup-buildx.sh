#!/bin/bash
docker run --privileged --rm tonistiigi/binfmt --install all
docker buildx create --name iot-nest-builder --driver docker-container --bootstrap --use