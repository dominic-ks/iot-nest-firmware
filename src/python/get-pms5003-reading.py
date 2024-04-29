import json
import os

if( os.getenv( 'NODE_ENV' ) == 'development' ):
  print( '[{"description": "PM1.0 ug/m3 (ultrafine particles)", "value": 1}, {"description": "PM2.5 ug/m3 (combustion particles, organic compounds, metals)", "value": 2}, {"description": "PM10 ug/m3  (dust, pollen, mould spores)", "value": 4}, {"description": "PM1.0 ug/m3 (atmos env)", "value": 1}, {"description": "PM2.5 ug/m3 (atmos env)", "value": 2}, {"description": "PM10 ug/m3 (atmos env)", "value": 4}, {"description": ">0.3um in 0.1L air", "value": 321}, {"description": ">0.5um in 0.1L air", "value": 96}, {"description": ">1.0um in 0.1L air", "value": 19}, {"description": ">2.5um in 0.1L air", "value": 6}, {"description": ">5.0um in 0.1L air", "value": 2}, {"description": ">10um in 0.1L air", "value": 2}]' )
  exit()
  
try:

  from pms5003 import PMS5003
  
  pms5003 = PMS5003(device="/dev/ttyAMA0", baudrate=9600, pin_enable="GPIO22", pin_reset="GPIO27")
  data_array = []

  data = pms5003.read()
  data = data.__str__()

  for line in data.splitlines():

    line_split = line.split( ':' )

    if( len( line_split ) == 2 ):

      line_object = {
        'description': line_split[0],
        'value': int( line_split[1] )
      }

      data_array.append( line_object )

    print( json.dumps( data_array ))
    exit()

except KeyboardInterrupt:
  pass