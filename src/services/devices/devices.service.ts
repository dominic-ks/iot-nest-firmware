import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { VirtualDevice } from '../../interfaces/virtual-device.interface';

import { DaikinAcService } from '../daikin-ac/daikin-ac.service';
import { HiveBulbService } from '../hive-bulb/hive-bulb.service';
import { HiveThermostatService } from '../hive-thermostat/hive-thermostat.service';
import { Pms5003Service } from '../pms5003/pms5003.service'; 
import { Pms5003SerialService } from '../pms5003-serial/pms5003-serial.service';
import { Mics6814SerialService } from '../mics6814-serial/mics6814-serial.service';
import { Mq135SerialService } from '../mq135-serial/mq135-serial.service';
import { Dht22SerialService } from '../dht22-serial/dht22-serial.service';
import { SonoffTempHumiditySensorService } from '../sonoff-temp-humidity-sensor/sonoff-temp-humidity-sensor.service';
import { VirtualThermostatService } from '../virtual-thermostat/virtual-thermostat.service';
import { UtilityService } from '../utility/utility.service';
import { Zigbee2mqttService } from '../zigbee2mqtt/zigbee2mqtt.service';
import { DummyDeviceService } from '../dummy-device/dummy-device.service';
import { Dht22DeviceService } from '../dht22-device/dht22-device.service';

import { AppMessagesService } from '../app-messages/app-messages.service';

import { Device } from '../../classes/device/device';
import { DeviceCommand } from '../../classes/device-command/device-command';
import { DeviceInterfaceClassDefinition } from '../../classes/device-interface-class-definition/device-interface-class-definition';

@Injectable()
export class DevicesService {

  private appMessagesService: AppMessagesService
  private devices = new BehaviorSubject( null );
  private devicesStore: VirtualDevice[] = [];

  public currentDevices = this.devices.asObservable();

  constructor(
    private readonly utilityService: UtilityService,
  ) {

    this.appMessagesService = this.utilityService.appMessagesService;

    this.appMessagesService.currentMessage.pipe(
      filter( message => message ),
      filter( message => message.type === 'device-add' ),
    ).subscribe(
      resp => this.addDevicesToStore( resp.data ),
    );

  }

  addDevicesToStore( device: Device ): void {

    console.log( device );

    try {
      let matchedDevices = this.devicesStore.filter( virtualDevice => virtualDevice.deviceInfo.id === device.id );

      if( matchedDevices.length === 0 ) {
        this.devicesStore.push( this.getDeviceInterface( device ));
        return;
      }

      let matchedDevice = matchedDevices[0];
      matchedDevice.updateDeviceData( device );

      this.devices.next( this.devicesStore );
    }

    catch( e ) {
      console.error( e );
    }

  }

  executeCommand( command: DeviceCommand ): void {

    try {
      const virtualDevice = this.getDeviceFromStore( command.deviceId );
      virtualDevice.executeDeviceCommand( command.data );
    }

    catch( e ) {
      console.log( 'Failed to execute device command:' , command );
    }

  }

  getDeviceInterface( device: Device ): VirtualDevice {

    const deviceInterfaceClassDefinitions = this.getDeviceInterfaceClassDefinitions();
    const deviceInterfaceClassDefinition = deviceInterfaceClassDefinitions.filter( definition => definition.type === device.type );

    if( deviceInterfaceClassDefinition.length === 0 ) {
      throw 'Unable to find a registered interface for device with ID ' + device.id + ' of type ' + device.type
    }

    const deviceClass = deviceInterfaceClassDefinition[0].class;
    const deviceObject = new deviceClass( this.utilityService );

    deviceObject.setDevice( device );
    return deviceObject;

  }

  getDeviceInterfaceClassDefinitions(): DeviceInterfaceClassDefinition[] {
    return [
      { type: 'daikin-ac-unit' , class: DaikinAcService },
      { type: 'dht22' , class: Dht22DeviceService },
      { type: 'dht22-serial' , class: Dht22SerialService },
      { type: 'dummy-device' , class: DummyDeviceService },
      { type: 'FWBulb02UK' , class: HiveBulbService },
      { type: 'mics6814-serial' , class: Mics6814SerialService },
      { type: 'mq135-serial' , class: Mq135SerialService },
      { type: 'pms5003' , class: Pms5003Service },
      { type: 'pms5003-serial' , class: Pms5003SerialService },
      { type: 'SLR1b' , class: HiveThermostatService },
      { type: 'SNZB-02D' , class: SonoffTempHumiditySensorService },
      { type: 'virtual-thermostat' , class: VirtualThermostatService },
      { type: 'zigbee2mqtt' , class: Zigbee2mqttService },
    ]
  }

  getDeviceFromStore( deviceId: string ): VirtualDevice {
    
    const virtualDevice = this.getDeviceStore().find( device => device.deviceInfo.id === deviceId );

    if( ! virtualDevice ) {
      throw 'Invalid device requested.';
    }

    return virtualDevice;

  }

  getDeviceStore(): VirtualDevice[] {
    return this.devicesStore;
  }

}
