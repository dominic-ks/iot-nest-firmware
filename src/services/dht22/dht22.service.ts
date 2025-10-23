import { Injectable } from '@nestjs/common';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { Device } from '../../classes/device/device';
import { VirtualDevice } from '../../interfaces/virtual-device.interface';
import { UtilityService } from '../utility/utility.service';

const { exec } = require( 'child_process' );

/*
Example DHT22 Device Configuration:

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

Data Format (matches virtual-thermostat):
- htemp: Temperature in Celsius as string (e.g., "22.5")
- hhum: Humidity percentage as string (e.g., "45.2")

Usage Notes:
- pin: GPIO pin number where DHT22 is connected (default: GPIO4)  
- interval: Reading interval in milliseconds (recommended: 30000-300000 for DHT22)
- type: Must be "dht22" to match the registered device type
*/

class DHT22DeviceReading {
  description: string;
  value: string;
}

class DHT22Device extends Device {
  data: {
    pin: string;
    htemp?: string;
    hhum?: string;
  }
}

@Injectable()
export class Dht22Service implements VirtualDevice {

  private appMessagesService: AppMessagesService;
  public deviceInfo: DHT22Device;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private utilityService: UtilityService,
  ) {
    this.appMessagesService = this.utilityService.appMessagesService;
  }

  executeDeviceCommand( commandData: any ): void { }

  getDeviceTypeName(): string {
    return 'Temperature and Humidity Sensor DHT22';
  }

  getSensorInfo(): void {

    exec( 'python-venv/bin/python dist/python/get-dht22-reading.py' , ( error , stdout , stderr ) => {

      if( error ) {
        return console.log( 'ERROR: ' , error );
      }
      
      const data = JSON.parse( stdout );
      this.setDeviceData( data );

    });
    
  }

  sendData() {
    this.appMessagesService.broadcastMessage({
      data: this.deviceInfo,
      type: 'mqtt-send',
    });
  }

  setDevice( device: DHT22Device ): void {

    this.updateDeviceData( device );
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.getSensorInfo();
    this.intervalId = setInterval(() => {
      this.getSensorInfo();
    }, this.deviceInfo.interval );

  }

  setDeviceData( data: DHT22DeviceReading[] ): void {

    let dataChanged = false;
    
    // Convert the array format to the virtual thermostat format
    const newData: any = {};
    
    for( let reading of data ) {
      if( reading.description === 'Temperature (°C)' ) {
        newData.htemp = reading.value.toString();
      } else if( reading.description === 'Humidity (%)' ) {
        newData.hhum = reading.value.toString();
      }
    }

    // Check if data has changed using the same logic as virtual thermostat
    for( let deviceProperty in newData ) {
      let devicePropertyValue = newData[ deviceProperty ];

      if( typeof( this.deviceInfo.data[ deviceProperty ]) !== 'undefined' && this.deviceInfo.data[ deviceProperty ] === devicePropertyValue ) {
        continue;
      }

      dataChanged = true;
      this.deviceInfo.data[ deviceProperty ] = devicePropertyValue;

    }

    if( ! dataChanged ) {
      return;
    }

    this.sendData();
    
  }

  updateDeviceData( device: DHT22Device ): void {
    this.deviceInfo = device;
  }

}
