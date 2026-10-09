import os
import glob
import json
import time
import datetime
import random
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Check if in development mode
is_development = os.getenv('NODE_ENV') == 'development'

# Readings come from the kernel dht11 IIO driver (handles DHT22 too), enabled with
# `dtoverlay=dht11,gpiopin=4` in /boot/firmware/config.txt (see bootstrap-host.sh).
IIO_GLOB = '/sys/bus/iio/devices/iio:device*'
READ_RETRIES = 5
RETRY_DELAY_SECONDS = 2.5  # DHT22 needs >2s between reads

script_dir = os.path.dirname(os.path.abspath(__file__))
default_output_file = os.path.join(os.path.dirname(script_dir), "dht22_readings.json")
output_file = os.getenv('DHT22_OUTPUT_FILE', default_output_file)


def find_iio_device():
    for device in sorted(glob.glob(IIO_GLOB)):
        try:
            with open(os.path.join(device, 'name')) as f:
                if f.read().strip().startswith('dht11'):
                    return device
        except OSError:
            continue
    return None


def read_milli_value(device, attribute):
    with open(os.path.join(device, attribute)) as f:
        return int(f.read().strip()) / 1000.0


def read_sensor(device):
    # The driver frequently returns EIO/ETIMEDOUT on a bad checksum, so retry.
    for _ in range(READ_RETRIES):
        try:
            temperature = read_milli_value(device, 'in_temp_input')
            humidity = read_milli_value(device, 'in_humidityrelative_input')
            return humidity, temperature
        except (OSError, ValueError):
            time.sleep(RETRY_DELAY_SECONDS)
    return None, None


device = None if is_development else find_iio_device()
if not is_development and device is None:
    print("No dht11 IIO device found - is dtoverlay=dht11,gpiopin=4 set in /boot/firmware/config.txt?")

while True:
    if is_development:
        # Generate dummy values
        temperature = round(random.uniform(20.0, 30.0), 1)
        humidity = round(random.uniform(40.0, 60.0), 1)
    else:
        if device is None:
            device = find_iio_device()
        humidity, temperature = read_sensor(device) if device else (None, None)

    if humidity is not None and temperature is not None:
        reading = {
            "time": datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
            "temp": round(temperature, 1),
            "hum": round(humidity, 1)
        }
        # Write atomically so the node app never reads a half-written file
        tmp_file = output_file + '.tmp'
        with open(tmp_file, 'w') as f:
            json.dump(reading, f)
            f.write('\n')
        os.replace(tmp_file, output_file)
        print(f"Temp: {temperature:.1f}°C  Humidity: {humidity:.1f}%", flush=True)
    else:
        print("Failed to retrieve data from sensor", flush=True)

    time.sleep(10)
