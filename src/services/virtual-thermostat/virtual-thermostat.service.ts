import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { UtilityService } from '../utility/utility.service';

import { Device } from '../../classes/device/device';

import { VirtualDevice } from '../../interfaces/virtual-device.interface';

var sensor = require( 'node-dht-sensor' );
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
  private configService: ConfigService;
  public deviceInfo: VirtualThermostatDevice;

  constructor(
    private utilityService: UtilityService,
  ) {
    this.appMessagesService = this.utilityService.appMessagesService;
    this.configService = this.utilityService.configService;
  }

  executeDeviceCommand( commandData: any ): void { }

  getDeviceTypeName(): string {
    return 'Virtual Thermostat';
  }

  getSensorInfo(): void {
    
    if( this.configService.get<string>( 'NODE_ENV' ) === 'development' ) {
      sensor.initialize({
        test: {
          fake: {
            temperature: 21,
            humidity: 60
          }
        }
      });
    }

    sensor.read( this.deviceInfo.data.type , this.deviceInfo.data.pin , function( err , temperature , humidity ) {
      if( ! err ) {
        return this.setDeviceData({
          htemp: temperature.toFixed( 1 ),
          hhum: humidity.toFixed( 1 ),
        });
      }
    }.bind( this ));

  }

  setDevice( device: VirtualThermostatDevice ): void {

    this.updateDeviceData( device );
    
    setInterval(() => {
      this.getSensorInfo();
    }, this.deviceInfo.interval );

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
