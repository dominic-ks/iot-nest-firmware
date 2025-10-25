import os
import json
import time
import datetime
import random
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Check if in development mode
is_development = os.getenv('NODE_ENV') == 'development'

if not is_development:
    import Adafruit_DHT

sensor = Adafruit_DHT.DHT22 if not is_development else None
pin = 4  # GPIO4

output_file = 'dht22_readings.json'

while True:
    if is_development:
        # Generate dummy values
        temperature = round(random.uniform(20.0, 30.0), 1)
        humidity = round(random.uniform(40.0, 60.0), 1)
    else:
        humidity, temperature = Adafruit_DHT.read_retry(sensor, pin)
    
    if humidity is not None and temperature is not None:
        reading = {
            "time": datetime.datetime.utcnow().isoformat() + 'Z',
            "temp": temperature,
            "hum": humidity
        }
        with open(output_file, 'w') as f:
            json.dump(reading, f)
            f.write('\n')
        print(f"Temp: {temperature:.1f}°C  Humidity: {humidity:.1f}%")
    else:
        print("Failed to retrieve data from sensor")
    
    time.sleep(10)