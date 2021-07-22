import { Test, TestingModule } from '@nestjs/testing';
import { Observable, throwError } from 'rxjs';
import { DaikinAcService } from './daikin-ac.service';

import { UtilityService } from '../utility/utility.service';

console.log = jest.fn();

describe( 'DaikinAcService' , () => {
  let service: DaikinAcService;

  let testDevice = {
    address: 'https://32192ef2-7f7e-493e-bd2d-edb88c66ce4a.mock.pstmn.io',
    data: {},
    id: 'test-device-001',
    type: 'daikin-ac-unit',
  }

  beforeEach( async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DaikinAcService,
        { provide: UtilityService , useValue: {
          appMessagesService: {
            broadcastMessage: () => true,
          },
          httpService: {
            get: jest.fn(() => {
               return new Observable( subscriber => {
                  subscriber.next({
                    data: 'key1=value1,key2=value2'
                  });
                  subscriber.complete();
                })
              }
            ).mockImplementationOnce(() => {
                 return new Observable( subscriber => {
                    subscriber.next({
                      data: 'key1=value1,key2=value2'
                    });
                    subscriber.complete();
                  })
                }
              ).mockImplementationOnce(() => {
                 return new Observable( subscriber => {
                   throw {
                     response: {
                       statusText: 'Mock error',
                     }
                   }
                   subscriber.complete();
                })
              }
            ).mockImplementationOnce(() => {
                 return new Observable( subscriber => {
                    subscriber.next({
                      data: 'key3=value3,key4=value4'
                    });
                    subscriber.complete();
                  })
                }
              ).mockImplementationOnce(() => {
                 return new Observable( subscriber => {
                   throw 'Mock error';
                   subscriber.complete();
                })
              }
            ),
          },
        }},
      ],
    }).compile();

    service = module.get<DaikinAcService>( DaikinAcService );
  });

  it( 'should be defined' , () => {
    expect( service ).toBeDefined();
  });

  it( 'should return the Device name' , () => {
    expect( typeof service.getDeviceTypeName()).toBe( 'string' );
  });

  it( 'should set device info and trigger get method' , () => {

    let getSpy = jest.spyOn( service , 'getSensorInfo' );

    jest.useFakeTimers();
    service.setDevice( testDevice );

    expect( service.deviceInfo ).toBeDefined();
    expect( getSpy ).toHaveBeenCalledTimes( 1 );

  });

  it( 'should handle an error from the device poller' , () => {

    jest.useFakeTimers();
    service.setDevice( testDevice );

    expect( setTimeout ).toHaveBeenCalledTimes( 1 );
    expect( setTimeout ).toHaveBeenLastCalledWith( expect.any( Function ) , 30000 );

    service.setDevice( testDevice );

  });

});
