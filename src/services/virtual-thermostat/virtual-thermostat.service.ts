import { Injectable } from '@nestjs/common';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { Device } from '../../classes/device/device';
import { VirtualDevice } from '../../interfaces/virtual-device.interface';

class VirtualThermostatDevice extends Device {
  data: {
    pin?: number;
    type?: number;
  }
  id: string;
  parent: string;
  type: string;
}

@Injectable()
export class VirtualThermostatService implements VirtualDevice {

  private appMessagesService: AppMessagesService;
  public deviceInfo: VirtualThermostatDevice;

  executeDeviceCommand( commandData: any ): void { }

  getDeviceTypeName(): string {
    return 'Virtual Thermostat';
  }

  getSensorInfo(): void {
    // get the readings and call setDeviceData...
  }

  setDevice( device: VirtualThermostatDevice ): void {

    this.updateDeviceData( device );
    
    setInterval(() => {
      this.getSensorInfo();
    }, 5000 );

  }

  sendData() {
    this.appMessagesService.broadcastMessage({
      data: this.deviceInfo,
      type: 'mqtt-send',
    });
  }

  setDeviceData( data: any ): void {

    let dataChanged = false;

    for( let deviceProperty in data ) {
      let devicePropertyValue = data[ deviceProperty ];

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

  updateDeviceData( device: VirtualThermostatDevice ): void {
    this.deviceInfo = device;
  }

}
