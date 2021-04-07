import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';

import { AuthService } from './services/auth/auth.service';
import { MqttHandlerService } from './services/mqtt-handler/mqtt-handler.service';

import { MqttConnectionOptions } from './classes/mqtt-connection-options/mqtt-connection-options';

jest.useFakeTimers();

describe('AppController', () => {
  let appController: AppController;

  beforeEach( async () => {

    const app: TestingModule = await Test.createTestingModule({
      controllers: [
        AppController
      ],
      imports: [
        ConfigModule.forRoot(),
      ],
      providers: [
        AuthService,
        ConfigService,
        { provide: MqttHandlerService , useValue: {
          setupMqttClient: ( connectionArgs: MqttConnectionOptions , deviceId: string , mqttTopic: string ) => true,
        }},
      ],
    }).compile();

    appController = app.get<AppController>( AppController );

  });

  it( 'should bootstrap the app' , () => {
    expect( appController ).toBeDefined();
  });

});
