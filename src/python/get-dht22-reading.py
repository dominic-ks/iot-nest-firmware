import json
import os
import time

if( os.getenv( 'NODE_ENV' ) == 'development' ):
  print( '[{"description": "Temperature (°C)", "value": 22.5}, {"description": "Humidity (%)", "value": 45.2}]' )
  exit()
  
try:

  import board
  import adafruit_dht
  
  # GPIO pin (default GPIO4, can be configured)
  pin_number = int(os.getenv('DHT22_PIN', 4))
  
  # Map pin number to board pin
  pin_map = {
    4: board.D4,
    17: board.D17,
    18: board.D18,
    22: board.D22,
    27: board.D27
  }
  
  pin = pin_map.get(pin_number, board.D4)  # Default to GPIO4 if not found
  
  # Initialize DHT22 sensor
  dht = adafruit_dht.DHT22(pin)
  
  data_array = []

  # Read temperature and humidity from DHT22 with multiple attempts
  humidity, temperature = None, None
  max_attempts = 3
  
  for attempt in range(max_attempts):
    try:
      temperature = dht.temperature
      humidity = dht.humidity
      if humidity is not None and temperature is not None:
        break
    except RuntimeError as error:
      # DHT sensors can be finicky, continue trying
      if attempt < max_attempts - 1:
        time.sleep(2)  # Wait 2 seconds between attempts
      continue
  
  if humidity is not None and temperature is not None:
    
    temperature_object = {
      'description': 'Temperature (°C)',
      'value': round(temperature, 1)
    }
    
    humidity_object = {
      'description': 'Humidity (%)',
      'value': round(humidity, 1)
    }
    
    data_array.append(temperature_object)
    data_array.append(humidity_object)
  
  else:
    # Return error values if reading failed
    temperature_object = {
      'description': 'Temperature (°C)',
      'value': -999
    }
    
    humidity_object = {
      'description': 'Humidity (%)',
      'value': -999
    }
    
    data_array.append(temperature_object)
    data_array.append(humidity_object)

  print( json.dumps( data_array ))
  
  # Clean up
  dht.exit()
  exit()

except KeyboardInterrupt:
  if 'dht' in locals():
    dht.exit()
except Exception as e:
  # Return error values if any exception occurs
  error_data = [
    {"description": "Temperature (°C)", "value": -999},
    {"description": "Humidity (%)", "value": -999}
  ]
  print( json.dumps( error_data ))
  if 'dht' in locals():
    dht.exit()
  exit()