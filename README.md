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
- For the DHT22 reader on a Raspberry Pi: the kernel DHT driver enabled with `dtoverlay=dht11,gpiopin=4` in `/boot/firmware/config.txt` (`bash/bootstrap-host.sh` adds this; reboot afterwards)
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
- Configure Zigbee2MQTT if using Zigbee devices:
   - Copy `zigbee2mqtt-configuration-example.yaml` to `~/.config/zigbee2mqtt/zigbee2mqtt-data/configuration.yaml`.
   - Update the coordinator `serial.port` and `serial.adapter` values for your hardware.
   - If your MQTT broker requires authentication, set `mqtt.user` and `mqtt.password`.
   - The example enables the Zigbee2MQTT frontend on container port `8080`; this repo publishes it on host port `8081` via Docker Compose.
- Optional DHT22 calibration: set `DHT22_HUM_SLOPE` / `DHT22_HUM_INTERCEPT` (and `DHT22_TEMP_OFFSET`) in the device `.env`. Fit them against a reference sensor; DHT22 humidity drifts with age.

## Provisioning a device

A 16GB A1/A2 microSD is plenty (8GB works; the footprint is ~3.5GB).

1. Flash **Raspberry Pi OS Lite (64-bit)** with Raspberry Pi Imager. In its settings, set the hostname, user `pi`, your SSH public key and Wi-Fi.
2. Restore the device's config into `/home/pi` (or create it fresh):
   - `~/.config/device/.env`: device ID, MQTT credentials, `DOCKERPROFILES`, optional DHT22 calibration.
   - `~/.config/zigbee2mqtt/zigbee2mqtt-data/`: keeps the Zigbee network key and paired devices. Without it, Zigbee devices must be re-paired.
   - `~/.ssh/id_rsa`: only needed for the reverse SSH tunnel.
3. Copy `bash/` to the device and run `sudo bash bash/bootstrap-host.sh`. It installs Docker and `python3-venv`, creates `/opt/myapp`, enables the DHT22 overlay, caps the swap file at 512MB, and sets up the tunnel if the key exists.
4. Reboot, then run `bash bash/deploy-app.sh` as `pi`. It installs the latest release, starts the containers and the DHT22 reader, and adds cron jobs that check for updates hourly and at boot.

If the Zigbee coordinator isn't at `/dev/ttyACM0` (Sonoff ZBDongle-P/E show up as `/dev/ttyUSB0`), set `ZIGBEE_ADAPTER` in the device `.env`.

## Remote access (reverse SSH tunnel)

Devices sit behind home routers, so instead of opening ports, each device keeps an **outbound** SSH connection to our tunnel server. Over that connection it asks the server to forward a port back to the device's own SSH:

```
you ──ssh──▶ tunnel server :REVERSE_SSH_REMOTE_PORT ──(through the tunnel)──▶ device :22
                       ▲
device ──autossh (outbound, reconnects automatically)──┘
```

`bash/setup-reverse-ssh.sh` (run by `bootstrap-host.sh` when `~/.ssh/id_rsa` exists) installs `autossh` and a systemd service, `device-reverse-ssh`, which runs `autossh -N -R REMOTE_PORT:localhost:22 USER@HOST` using the device key `~/.ssh/id_rsa`.

**Per device, set in `~/.config/device/.env`:**

| Key | Meaning |
|---|---|
| `REVERSE_SSH_HOST` | Tunnel server hostname |
| `REVERSE_SSH_PORT` | SSH port on the tunnel server (usually 22) |
| `REVERSE_SSH_USER` | Account on the tunnel server that devices log in as |
| `REVERSE_SSH_REMOTE_PORT` | Port on the server for this device; must be unique per device |
| `REVERSE_SSH_LOCAL_PORT` | Device port to expose (22) |

**On the tunnel server:** add the device's public key (`~/.ssh/id_rsa.pub`) to `REVERSE_SSH_USER`'s `~/.ssh/authorized_keys`, ideally restricted with `restrict,port-forwarding`.

**Apply changes:** `sudo systemctl restart device-reverse-ssh`. Check with `systemctl status device-reverse-ssh`.

**Connect to a device:** `ssh -J <you>@<tunnel host> -p <REVERSE_SSH_REMOTE_PORT> pi@localhost`

## Usage

### Development

```bash
# Start in development mode with watch
npm run start:dev

## Handy: Forward USB to WSL
 - https://learn.microsoft.com/en-us/windows/wsl/connect-usb
 - Run `sudo modprobe vhci_hcd` in WSL first
 - List USB devices in Windows: `usbipd list`
 - Bind USB device: `usbipd bind --busid <busid>`
 - Attach USB device to WSL: `usbipd attach --wsl --busid <busid>`