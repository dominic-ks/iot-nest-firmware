import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';

import { VirtualDevice } from '../../interfaces/virtual-device.interface';

import { DaikinAcService } from '../daikin-ac/daikin-ac.service';

import { Device } from '../../classes/device/device';
import { DeviceInterfaceClassDefinition } from '../../classes/device-interface-class-definition/device-interface-class-definition';

@Injectable()
export class DevicesService {

  private devices = new BehaviorSubject( null );
  private devicesStore: VirtualDevice[] = [];

  public currentDevices = this.devices.asObservable();

  constructor() {
    this.addDevicesToStore({
      id: 'sub-device-001',
      type: 'daikin-ac-unit',
    });
  }

  addDevicesToStore( device: Device ): void {
    this.devicesStore.push( this.getDeviceInterface( device ));
    this.devices.next( this.devicesStore );
  }

  getDeviceInterface( device: Device ): VirtualDevice {

    const deviceInterfaceClassDefinitions = this.getDeviceInterfaceClassDefinitions();
    const deviceInterfaceClassDefinition = deviceInterfaceClassDefinitions.filter( definition => definition.type === device.type );

    if( deviceInterfaceClassDefinition.length === 0 ) {
      throw 'Unable to find a registered interface for device with ID ' + device.id + ' of type ' + device.type;
    }

    const deviceClass = deviceInterfaceClassDefinition[0].class;
    const deviceObject = new deviceClass();

    deviceObject.setDevice( device );
    return deviceObject;

  }

  getDeviceInterfaceClassDefinitions(): DeviceInterfaceClassDefinition[] {
    return [
      { type: 'daikin-ac-unit' , class: DaikinAcService },
    ]
  }

  getDeviceInterfaceClassList() {
    return [
      DaikinAcService
    ]
  }

}
