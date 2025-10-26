#!/bin/bash

set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

python3 -m venv python-venv
source python-venv/bin/activate
pip install -r py-requirements.txt
python3 dist/python/get-dht22-reading.py