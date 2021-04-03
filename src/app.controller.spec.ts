import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

import { AuthService } from './services/auth/auth.service';
import { DevicesService } from './services/devices/devices.service';
import { MqttHandlerService } from './services/mqtt-handler/mqtt-handler.service';

jest.useFakeTimers();
console.log = jest.fn()

describe('AppController', () => {
  let appController: AppController;

  beforeEach( async () => {

    const app: TestingModule = await Test.createTestingModule({
      controllers: [
        AppController
      ],
      providers: [
        AuthService,
        DevicesService,
        { provide: MqttHandlerService , useValue: {
          getMqttClient: ( connectionArgs ) => {
            return {
              on: ( type: string , callback: Function ) => {

                if( type === 'connect' ) {
                  callback( true );
                }

                return true;

              },
              publish: ( mqttTopic: string , jsonPayload: string , options: Object ) => true,
              subscribe: ( path: string ) => true,
            }
          }
        }},
      ],
    }).compile();

    appController = app.get<AppController>( AppController );

  });

  it( 'should bootstrap the app' , () => {

    expect( appController ).toBeDefined();

    expect( setTimeout ).toHaveBeenCalledTimes( 1 );
    expect( setTimeout ).toHaveBeenLastCalledWith( expect.any( Function ) , 30000 );

  });

});
