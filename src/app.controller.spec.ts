import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

import { MqttHandlerService } from './services/mqtt-handler/mqtt-handler.service';

jest.useFakeTimers();

describe('AppController', () => {
  let appController: AppController;

  beforeEach( async () => {

    const app: TestingModule = await Test.createTestingModule({
      controllers: [
        AppController
      ],
      providers: [
        { provide: MqttHandlerService , useValue: {
          setupMqttClient: () => true,
        }},
      ],
    }).compile();

    appController = app.get<AppController>( AppController );

  });

  it( 'should bootstrap the app' , () => {
    expect( appController ).toBeDefined();
  });

});
