import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { Zigbee2mqttService } from '../zigbee2mqtt/zigbee2mqtt.service';
import { UtilityService } from '../utility/utility.service';

import { VirtualDevice } from 'src/interfaces/virtual-device.interface';
import { Device } from 'src/classes/device/device';

class HiveBulbCommand {
  slug: string;
  value: any;
}

@Injectable()
export class HiveBulbService implements VirtualDevice {
  
  private appMessagesService: AppMessagesService;
  private mqttResponseSubject: BehaviorSubject<any> = new BehaviorSubject( null );
  private zigbee2mqttService: Zigbee2mqttService;

  public deviceInfo: Device;

  constructor(
    private utilityService: UtilityService,
  ) {

    this.appMessagesService = this.utilityService.appMessagesService;
    this.zigbee2mqttService = this.utilityService.get( 'zigbee2mqttService' );

    this.mqttResponseSubject.asObservable().pipe(
      // we are debouncing here because we receive one update from mqtt for each field update 
      debounceTime( 1000 ),
      filter( data => data !== null ),
      filter( data => this.isDataUpdated( data )),
    ).subscribe(
      resp => {

        this.deviceInfo.data = resp;
        
        this.appMessagesService.broadcastMessage({
          data: this.deviceInfo,
          type: 'mqtt-send',
        });

      },
    );

  }

  executeDeviceCommand( commandData: HiveBulbCommand[] ) {

    let state = this.deviceInfo.data.state;
    let brightness = this.deviceInfo.data.state;

    const stateCommand = commandData.find( command => command.slug === 'state' );
    const brightnessCommand = commandData.find( command => command.slug === 'brightness' );

    const stateValue = this.switchModeVerb( stateCommand.value );
    const stateMatch = stateValue === state;

    const brightnessValue = this.switchModeVerb( brightnessCommand.value );
    const brightnessMatch = brightnessValue === state;

    if( stateMatch && brightnessMatch ) {
      return;
    }

    if( stateCommand ) {
      state = stateCommand.value
    }

    if( brightnessCommand ) {
      brightness = brightnessCommand.value
    }

    switch( state ) {

      case 'ON':
        this.executeDeviceOn( brightness );
        break;

      case 'OFF':
        this.executeDeviceOff();
        break;

      default:
        console.warn( 'Device ' + this.deviceInfo.id + ' received an unexpected mode command: ' + state );
        break;

    }
  }

  executeDeviceOn( brightness: number ): void {

    const sendData = {
      brightness: brightness,
      state: 'ON',
    }

    this.zigbee2mqttService.mqttPublish( this.deviceInfo , 'set' , sendData );

  }

  executeDeviceOff(): void {

    const sendData = {
      state: 'OFF',
    }

    this.zigbee2mqttService.mqttPublish( this.deviceInfo , 'set' , sendData );

  }

  getDeviceTypeName(): string {
    return 'Hive Bulb';
  }

  isDataUpdated( data: any ): boolean {
    for( let key in data ) {

      const value = data[ key ];
      const existingValue = this.deviceInfo.data[ key ];

      if( value === existingValue ) {
        continue;
      }

      return true;

    }

    return false;

  }

  mqttSubscribe() {

    const traits = this.zigbee2mqttService.getDeviceTraits( this.deviceInfo );

    // cut this down to just send one trait, since it's now in this device class an we know we only need one...
    for( let trait in traits ) {

      let object = {}
      object[ trait ] = ''

      this.zigbee2mqttService.mqttPublish( this.deviceInfo , 'get' , object );

      break;
   
    }

    this.zigbee2mqttService.mqttSubscribe( this.deviceInfo , ( topic: string , message: string ) => {

      if( topic.indexOf( this.deviceInfo.id ) === -1 ) {
        return;
      }

      const decodedMessage = JSON.parse( Buffer.from( message , 'base64' ).toString( 'ascii' ));
      this.mqttResponseSubject.next( decodedMessage );

    });
    
  }

  setDevice( device: Device ) {
    this.updateDeviceData( device );
  }

  setDeviceData( data: any ) { }

  switchModeVerb( verb: string ): string {
    const foundVerb = [
      { local: 'on' , device: 'on' },
      { local: 'off' , device: 'off' },
    ].find( checkVerb => checkVerb.local === verb );
    return foundVerb ? foundVerb.device : 'unknown';
  }

  updateDeviceData( device: Device ) {
    this.deviceInfo = device;
    this.deviceInfo.data = typeof( this.deviceInfo.data ) !== 'undefined' ? this.deviceInfo.data : {};
    this.mqttSubscribe();
  }

}
