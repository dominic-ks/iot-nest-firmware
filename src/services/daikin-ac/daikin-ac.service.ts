import { Injectable, HttpService } from '@nestjs/common';
import { forkJoin } from 'rxjs';

import { VirtualDevice } from '../../interfaces/virtual-device.interface';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { UtilityService } from '../utility/utility.service';

import { Device } from '../../classes/device/device';
import { request } from 'express';

class DaikinAcDevice extends Device {
  address: string;
  id: string;
  parent: string;
  type: string;
}

class DaikinAcCommandData {
  slug: string;
  value: any;
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

  executeDeviceCommand( data: DaikinAcCommandData[] ): void {

    let sendData = []

    for( let datapair of data ) {
      sendData.push( datapair.slug + '=' + datapair.value );
    }

    const requestUrl = this.deviceInfo.address + '/aircon/set_control_info?' + sendData.join( '&' );
    console.log( requestUrl );

    this.httpService.post( requestUrl ).subscribe(
      resp => {
        console.log( 'Command successfully executed for device ' , this.deviceInfo.id );
        this.getSensorInfo();
      },
      error => {
        console.log( error.response.status , ': ' , error.response.statusText );
      }
    );

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

      },
      error => {

        if( typeof( error.response ) !== 'undefined' && typeof( error.response.statusText ) !== 'undefined' ) {
          return console.log( 'Daikin AC polling structured error' , error.response.statusText );
        }

        return console.log( 'Daikin AC polling error' , error );

      }
    );

  }

  setDevice( device: DaikinAcDevice ): void {

    this.updateDeviceData( device );
    
    setInterval(() => {
      this.getSensorInfo();
    }, this.deviceInfo.interval );

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
      return;
    }

    this.sendData();

  }

  sendData() {
    this.appMessagesService.broadcastMessage({
      data: this.deviceInfo,
      type: 'mqtt-send',
    });
  }

  updateDeviceData( device: DaikinAcDevice ): void {
    this.deviceInfo = device;
  }

}
