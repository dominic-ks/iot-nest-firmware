import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { Zigbee2mqttService } from '../zigbee2mqtt/zigbee2mqtt.service';
import { UtilityService } from '../utility/utility.service';

import { VirtualDevice } from 'src/interfaces/virtual-device.interface';
import { Device } from 'src/classes/device/device';

class HiveThermostatCommand {
  slug: string;
  value: any;
}

@Injectable()
export class HiveThermostatService implements VirtualDevice {
  
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
      map( data => {
        
        if( data.occupied_heating_setpoint == 1 ) {
          data.occupied_heating_setpoint = this.deviceInfo.data.occupied_heating_setpoint;
        }

        return data;

      }),
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

  executeDeviceCommand( commandData: HiveThermostatCommand[] ) {

    let mode = this.deviceInfo.data.system_mode;
    let setPoint = this.deviceInfo.data.occupied_heating_setpoint;

    const modeCommand = commandData.find( command => command.slug === 'mode' );
    const setPointCommand = commandData.find( command => command.slug === 'occupied_heating_setpoint' );

    const modeValue = this.switchModeVerb( modeCommand.value );
    const modeMatch = modeValue === mode;
    const setPointMatch = setPointCommand.value == setPoint;

    if( modeMatch && setPointMatch ) {
      return;
    }

    if( modeCommand ) {
      mode = modeCommand.value
    }

    if( setPointCommand ) {
      setPoint = setPointCommand.value;
    }

    switch( mode ) {

      case 'emergency_heating':
        this.executeDeviceEmergencyHeating( setPoint );
        break;

      case 'heat':
        this.executeDeviceOn( setPoint );
        break;

      case 'off':
        this.executeDeviceOff();
        break;

      default:
        console.warn( 'Device ' + this.deviceInfo.id + ' received an unexpected mode command: ' + mode );
        break;

    }
  }

  executeDeviceEmergencyHeating( setPoint: number ): void {

    const sendData = {
      system_mode: 'emergency_heating',
      temperature_setpoint_hold_duration: '15',
      temperature_setpoint_hold: '1',
      occupied_heating_setpoint: setPoint,
   }

   this.zigbee2mqttService.mqttPublish( this.deviceInfo , 'set' , sendData );

  }

  executeDeviceOn( setPoint: number ): void {

    const sendData = {
      system_mode: 'heat',
      temperature_setpoint_hold: '1',
      occupied_heating_setpoint: setPoint,
   }

   this.zigbee2mqttService.mqttPublish( this.deviceInfo , 'set' , sendData );

  }

  executeDeviceOff(): void {

    const sendData = {
      system_mode: 'off',
      temperature_setpoint_hold: '0',
   }

   this.zigbee2mqttService.mqttPublish( this.deviceInfo , 'set' , sendData );

  }

  getDeviceTypeName(): string {
    return 'Hive Thermostat';
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
      { local: 'heat' , device: 'emergency_heating' },
      { local: 'auto' , device: 'heat' },
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
