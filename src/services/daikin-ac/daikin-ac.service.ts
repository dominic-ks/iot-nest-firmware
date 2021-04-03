import { Injectable } from '@nestjs/common';
import { VirtualDevice } from '../../interfaces/virtual-device.interface';

import { Device } from '../../classes/device/device';

@Injectable()
export class DaikinAcService implements VirtualDevice {

  public deviceInfo: Device;

  getDeviceTypeName() {
    return 'Daikin AC Unit';
  }

  getTelemtryData(): Object {
    return {
      temp: 20,
      humd: 0,
      time: new Date().toISOString().slice( 0 , 19 ).replace( 'T' , ' ' ),
      power: 'ON',
    };
  }

  setDevice( device: Device ): void {
    this.deviceInfo = device;
  }

}
