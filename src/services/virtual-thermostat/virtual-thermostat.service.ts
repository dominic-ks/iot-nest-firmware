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
  private currentTemperature: number = 19.5; // Initial value in middle of range
  private currentHumidity: number = 70; // Initial value in middle of range

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

  private generateRandomValue(currentValue: number, min: number, max: number): number {
    // Calculate ±5% range
    const fivePercent = currentValue * 0.05;
    const changeMin = Math.max(min, currentValue - fivePercent);
    const changeMax = Math.min(max, currentValue + fivePercent);
    
    // Generate random value within the constrained range
    return Math.random() * (changeMax - changeMin) + changeMin;
  }

  getSensorInfo(): void {
    
    if( this.configService.get<string>( 'NODE_ENV' ) === 'development' ) {
      // Generate new random values with ±5% change constraint
      this.currentTemperature = this.generateRandomValue(this.currentTemperature, 18, 21);
      this.currentHumidity = this.generateRandomValue(this.currentHumidity, 60, 80);
      
      sensor.initialize({
        test: {
          fake: {
            temperature: this.currentTemperature,
            humidity: this.currentHumidity
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
