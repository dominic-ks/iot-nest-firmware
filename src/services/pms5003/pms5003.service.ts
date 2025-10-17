import { Injectable } from '@nestjs/common';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { Device } from '../../classes/device/device';
import { VirtualDevice } from '../../interfaces/virtual-device.interface';
import { UtilityService } from '../utility/utility.service';

const child_process = require( 'child_process' );
const { exec } = require( 'child_process' );

// sample config
[
  {
    "address": "N/A",
    "data": {
      "serialDevice": "/dev/ttyAMA0",
      "pinEnable": "GPIO22",
      "pinReset": "GPIO27"
    },
    "id": "PMS5003-001",
    "interval": 300000,
    "parent": "dev-device-001",
    "type": "pms5003"
  }
]

class PMS5003DeviceReading {
  description: string;
  value: string;
}

class PMS5003Device extends Device {
  data: {
    lastRead: PMS5003DeviceReading[];
    pinEnable: string;
    pinReset: string;
    serialDevice: string;
  }
}

@Injectable()
export class Pms5003Service implements VirtualDevice {

  private appMessagesService: AppMessagesService;
  public deviceInfo: PMS5003Device;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private utilityService: UtilityService,
  ) {
    this.appMessagesService = this.utilityService.appMessagesService;
  }

  executeDeviceCommand( commandData: any ): void { }

  getDeviceTypeName(): string {
    return 'Particulate Sensor PMS5003';
  }

  getSensorInfo(): void {

    exec( 'python-venv/bin/python dist/python/get-pms5003-reading.py' , ( error , stdout , stderr ) => {

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

  setDevice( device: PMS5003Device ): void {

    this.updateDeviceData( device );
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.getSensorInfo();
    this.intervalId = setInterval(() => {
      this.getSensorInfo();
    }, this.deviceInfo.interval );

  }

  setDeviceData( data: PMS5003DeviceReading[] ): void {

    let dataChanged = false;

    for( let deviceProperty of data ) {

      const currentValue = this.deviceInfo.data.lastRead.find(( item ) => item.description === deviceProperty.description );

      if( currentValue && currentValue.value === deviceProperty.value ) {
        continue;
      }

      dataChanged = true;

    }

    if( ! dataChanged ) {
      return;
    }

    this.deviceInfo.data.lastRead = data;
    this.sendData();
    
  }

  updateDeviceData( device: PMS5003Device ): void {
    this.deviceInfo = device;
    this.deviceInfo.data.lastRead = this.deviceInfo.data.lastRead || [];
  }


}
