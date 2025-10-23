# DHT22 Temperature and Humidity Sensor Service

This service interfaces with DHT22 (AM2302) temperature and humidity sensors via GPIO pins.

## Features
- Temperature reading in Celsius
- Humidity reading as percentage
- Configurable GPIO pin
- Automatic retry mechanism for reliable readings
- Development mode with mock data for testing

## Configuration

```json
{
  "address": "N/A",
  "data": {
    "pin": "GPIO4"
  },
  "id": "DHT22-001",
  "interval": 60000,
  "parent": "dev-device-001",
  "type": "dht22"
}
```

### Configuration Parameters
- `pin`: GPIO pin number where DHT22 is connected (e.g., "GPIO4")
- `interval`: Reading interval in milliseconds (recommended: 30000-300000)
- `type`: Must be "dht22" to match the registered device type
- `id`: Unique identifier for the device

## Hardware Requirements
- DHT22 (AM2302) sensor
- Raspberry Pi or compatible GPIO-enabled device
- Pull-up resistor (10kΩ recommended)

## Dependencies
- Adafruit_DHT Python library
- GPIO access permissions

## Testing
For testing without hardware (development mode):
```bash
NODE_ENV=development python3 src/python/get-dht22-reading.py
```

## Data Format
The service returns JSON data in the following format:
```json
[
  {"description": "Temperature (°C)", "value": 22.5},
  {"description": "Humidity (%)", "value": 45.2}
]
```

Error conditions return -999 values for both temperature and humidity.