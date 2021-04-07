import { Test, TestingModule } from '@nestjs/testing';
import { Observable } from 'rxjs';
import { DevicesService } from './devices.service';

import { DeviceInterfaceClassDefinition } from '../../classes/device-interface-class-definition/device-interface-class-definition';

import { UtilityService } from '../utility/utility.service';

describe( 'DevicesService' , () => {
  let service: DevicesService;

  let testDevice = {
    id: 'my-test-device',
    type: 'daikin-ac-unit',
  }

  beforeEach( async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: UtilityService , useValue: {
          appMessagesService: {
            broadcastMessage: () => true,
          },
          httpService: {
            get: () => {
              return new Observable( subscriber => {
                subscriber.next({
                  data: 'key1=value1,key2=value2'
                });
                subscriber.complete();
              });
            },
          },
          get: ( type: string ): any => {
            let object = Object.assign( {} , this );
              return this?[ type ] : false;
          },
        }},
      ],
    }).compile();

    service = module.get<DevicesService>( DevicesService );
  });

  it( 'should be defined' , () => {
    expect( service ).toBeDefined();
  });

  it( 'should return a device interface of a requested type' , () => {

    service.addDevicesToStore( testDevice );

    let testDeviceInterfaces = service.getDeviceStore().filter( device => device.deviceInfo.id === testDevice.id );
    let testDeviceInterface = testDeviceInterfaces[0];

    expect( testDeviceInterface.deviceInfo.id ).toEqual( testDevice.id );

  });

  it( 'should return an array of DeviceInterfaceClassDefinition objects' , () => {
    let deviceInterfaceClassDefinitions = service.getDeviceInterfaceClassDefinitions();
    expect( deviceInterfaceClassDefinitions[0].type ).toBeTruthy();
    expect( deviceInterfaceClassDefinitions[0].class ).toBeTruthy();
  });

});
