import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { MqttHandlerService } from './mqtt-handler.service';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { AuthService } from '../auth/auth.service';
import { DevicesService } from '../devices/devices.service';

console.log = jest.fn()

var mockMqttClient =  {
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

jest.mock( 'mqtt' , () => {
  return {
    connect: ( args ) => {
      return mockMqttClient;
    },
  }
});

describe( 'MqttHandlerService' , () => {
  let service: MqttHandlerService;
  let testModule: TestingModule;

  beforeEach( async () => {
    testModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
      ],
      providers: [
        AppMessagesService,
        AuthService,
        ConfigService,
        MqttHandlerService,
        { provide: DevicesService , useValue: {
          addDevicesToStore: () => true,
        }},
      ],
    }).compile();

    service = testModule.get<MqttHandlerService>( MqttHandlerService );
  });

  it( 'should be defined' , () => {
    expect( service ) .toBeDefined();
  });

  it( 'should call the getMqttClient method' , async () => {

    let getSpy = jest.spyOn( service , 'getMqttClient' );

    service.setupMqttClient();
    expect( getSpy ).toHaveBeenCalledTimes( 2 );

    service.disconnect();

  });

  it( 'should return a new mqtt client if one does not exist' , () => {
    let mqttClient = service.getMqttClient();
    expect( mqttClient ).toEqual( mockMqttClient );
  });

  it( 'should end the current mtqq connection and reconnect if one exists' , () => {

    let mtqqClientEndSpy = jest.spyOn( mockMqttClient , 'end' );
    let mqttClient = service.getMqttClient();
    
    let authService = testModule.get( AuthService );

    authService.validateJwt = () => false;
    mqttClient = service.getMqttClient();

    expect( mtqqClientEndSpy ).toHaveBeenCalledTimes( 1 );
    expect( mqttClient ).toEqual( mockMqttClient );

  });

  it( 'should ignore messages from the messaging service where the message is null' , () => {

    let appMessagesService = testModule.get<AppMessagesService>( AppMessagesService );
    let addToQueueSpy = jest.spyOn( service , 'addToQueue' );

    appMessagesService.broadcastMessage( null );

    expect( addToQueueSpy ).toHaveBeenCalledTimes( 0 );

  });

  it( 'should ignore messages from the messaging service where the message type is not mqtt-send' , () => {

    let appMessagesService = testModule.get<AppMessagesService>( AppMessagesService );
    let addToQueueSpy = jest.spyOn( service , 'addToQueue' );

    appMessagesService.broadcastMessage({
      data: 'any',
      type: 'not-mqtt-send',
    });

    expect( addToQueueSpy ).toHaveBeenCalledTimes( 0 );

  });

  it( 'should call add to queue when a valid message is received from the messaging service' , () => {

    let appMessagesService = testModule.get<AppMessagesService>( AppMessagesService );
    let addToQueueSpy = jest.spyOn( service , 'addToQueue' );

    appMessagesService.broadcastMessage({
      data: 'valid-data',
      type: 'mqtt-send',
    });

    expect( addToQueueSpy ).toHaveBeenCalledTimes( 1 );

  });

});
