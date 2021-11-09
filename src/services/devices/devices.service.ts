import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';

import { VirtualDevice } from '../../interfaces/virtual-device.interface';

import { DaikinAcService } from '../daikin-ac/daikin-ac.service';
import { UtilityService } from '../utility/utility.service';

import { Device } from '../../classes/device/device';
import { DeviceInterfaceClassDefinition } from '../../classes/device-interface-class-definition/device-interface-class-definition';

@Injectable()
export class DevicesService {

  private devices = new BehaviorSubject( null );
  private devicesStore: VirtualDevice[] = [];

  public currentDevices = this.devices.asObservable();

  constructor(
    private readonly utilityService: UtilityService,
  ) { }

  addDevicesToStore( device: Device ): void {

    let matchedDevices = this.devicesStore.filter( virtualDevice => virtualDevice.deviceInfo.id === device.id );

    if( matchedDevices.length === 0 ) {
      this.devicesStore.push( this.getDeviceInterface( device ));
      return;
    }

    let matchedDevice = matchedDevices[0];
    matchedDevice.updateDeviceData( device );

    this.devices.next( this.devicesStore );

  }

  getDeviceInterface( device: Device ): VirtualDevice {

    const deviceInterfaceClassDefinitions = this.getDeviceInterfaceClassDefinitions();
    const deviceInterfaceClassDefinition = deviceInterfaceClassDefinitions.filter( definition => definition.type === device.type );

    if( deviceInterfaceClassDefinition.length === 0 ) {
      throw 'Unable to find a registered interface for device with ID ' + device.id + ' of type ' + device.type;
    }

    const deviceClass = deviceInterfaceClassDefinition[0].class;
    const deviceObject = new deviceClass( this.utilityService );

    deviceObject.setDevice( device );
    return deviceObject;

  }

  getDeviceInterfaceClassDefinitions(): DeviceInterfaceClassDefinition[] {
    return [
      { type: 'daikin-ac-unit' , class: DaikinAcService },
    ]
  }

  getDeviceStore(): VirtualDevice[] {
    return this.devicesStore;
  }

}
