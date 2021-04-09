import { Injectable, HttpService } from '@nestjs/common';
import { forkJoin } from 'rxjs';

import { VirtualDevice } from '../../interfaces/virtual-device.interface';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { UtilityService } from '../utility/utility.service';

import { Device } from '../../classes/device/device';

class DaikinAcDevice extends Device {
  address: string;
  id: string;
  type: string;
}

class DaikinAcDeviceSensorInfo {

}

@Injectable()
export class DaikinAcService implements VirtualDevice {

  private appMessagesService: AppMessagesService;
  private httpService: HttpService;
  public deviceInfo: DaikinAcDevice;

  constructor(
    private utilityService: UtilityService,
  ) {
    this.appMessagesService = this.utilityService.appMessagesService;
    this.httpService = this.utilityService.httpService;
  }

  getDeviceTypeName() {
    return 'Daikin AC Unit';
  }

  getSensorInfo(): void {

    let controlInfo = this.httpService.get( this.deviceInfo.address + '/aircon/get_control_info' );
    let sensorInfo = this.httpService.get( this.deviceInfo.address + '/aircon/get_sensor_info' );

    forkJoin([ controlInfo , sensorInfo ]).subscribe(
      resp => {

        let responseData = {}

        for( let response of resp ) {
          let responseSplit = response.data.split( ',' );

          for( let responseValue of responseSplit ) {
            let responsePairs = responseValue.split( '=' );
            responseData[ responsePairs[0] ] = responsePairs[1];
          }

        }

        this.setDeviceData( responseData );

        setTimeout(() => {
          this.getSensorInfo();
        }, 30000 );

      },
      error => {

        setTimeout(() => {
          this.getSensorInfo();
        }, 30000 );

        if( typeof( error.response ) !== 'undefined' && typeof( error.response.statusText ) !== 'undefined' ) {
          return console.log( 'Daikin AC polling error' , error.response.statusText );
        }

        return console.log( 'Daikin AC polling error' , error );

      }
    );

  }

  setDevice( device: DaikinAcDevice ): void {
    this.deviceInfo = device;
    this.getSensorInfo();
  }

  setDeviceData( data: any ) {

    let dataChanged = false;

    if( typeof( this.deviceInfo.data ) === 'undefined' ) {
      this.deviceInfo.data = {};
    }

    for( let deviceProperty in data ) {
      let devicePropertyValue = data[ deviceProperty ];

      if( typeof( this.deviceInfo.data[ deviceProperty ]) !== 'undefined' && this.deviceInfo.data[ deviceProperty ] === devicePropertyValue ) {
        continue;
      }

      dataChanged = true;
      this.deviceInfo.data[ deviceProperty ] = devicePropertyValue;

    }

    if( ! dataChanged ) {
      //return;
    }

    this.sendData();

  }

  sendData() {
    this.appMessagesService.broadcastMessage({
      data: this.deviceInfo,
      type: 'mqtt-send',
    });
  }

}
