# IoT Nest Firmware

A NestJS-based IoT firmware application designed for Raspberry Pi and similar devices. It integrates with various sensors and devices (e.g., DHT22, PMS5003, Zigbee2MQTT) and communicates via MQTT, with support for Google Cloud IoT Core.

## Features

- **Device Integration**: Supports multiple IoT devices including temperature/humidity sensors, air quality monitors, and Zigbee devices.
- **MQTT Communication**: Publishes sensor data and handles device commands via MQTT.
- **Google Cloud IoT Core**: Optional integration for cloud-based device management.
- **Docker Support**: Easy deployment using Docker Compose.
- **Hardware Abstraction**: Works with GPIO, serial ports, and USB devices.

## Prerequisites

- Node.js (v14 or later)
- Python 3.8+ (for sensor scripts)
- Docker and Docker Compose
- Raspberry Pi or compatible hardware (for GPIO/serial access)
- Google Cloud account (optional, for IoT Core integration)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/iot-nest-firmware.git
   cd iot-nest-firmware
   ```

2. Install dependencies:
   ```bash
   npm install
   pip install -r py-requirements.txt
   ```

3. Copy the environment file and configure it:
   ```bash
   cp .env-example .env
   # Edit .env with your specific values
   ```

4. Build the application:
   ```bash
   npm run build
   ```

## Configuration

- Edit `.env` based on `.env-example`.
- For Google Cloud IoT Core, set up your project, registry, and device as per [Google's documentation](https://cloud.google.com/iot/docs).
- Configure Zigbee2MQTT if using Zigbee devices (see `zigbee2mqtt-configuration-example.yaml`).

## Usage

### Development

```bash
# Start in development mode with watch
npm run start:dev
