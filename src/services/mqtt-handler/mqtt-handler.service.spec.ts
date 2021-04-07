import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { MqttHandlerService } from './mqtt-handler.service';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { AuthService } from '../auth/auth.service';
import { DevicesService } from '../devices/devices.service';
import { UtilityService } from '../utility/utility.service';

console.log = jest.fn()

jest.mock( 'mqtt' , () => {
  return {
    connect: ( args ) => {
      return {
        end: () => true,
        on: ( type: string , callback: Function ) => {

          if( type === 'connect' ) {
            callback( true );
          }

          return true;

        },
        publish: ( mqttTopic: string , jsonPayload: string , options: Object ) => true,
        subscribe: ( path: string ) => true,
      }
    },
  }
});

describe( 'MqttHandlerService' , () => {
  let service: MqttHandlerService;

  beforeEach( async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
      ],
      providers: [
        AppMessagesService,
        AuthService,
        ConfigService,
        MqttHandlerService,
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
        }},
      ],
    }).compile();

    service = module.get<MqttHandlerService>( MqttHandlerService );
  });

  it( 'should be defined' , () => {
    expect( service ) .toBeDefined();
  });

  it( 'should call the getMqttClient method' , async () => {

    let getSpy = jest.spyOn( service , 'getMqttClient' );

    await service.setupMqttClient();
    expect( getSpy ).toHaveBeenCalledTimes( 1 );

    await service.disconnect();

  });

});
