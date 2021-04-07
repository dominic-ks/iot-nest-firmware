import { Injectable } from '@nestjs/common';
import { filter } from 'rxjs/operators';

import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { DevicesService } from '../devices/devices.service';

import { AppMessage } from '../../classes/app-message/app-message';
import { MqttConnectionOptions } from '../../classes/mqtt-connection-options/mqtt-connection-options';

const deviceList = require( '../../../devices.json' );

@Injectable()
export class MqttHandlerService {

  private connectionArgs: MqttConnectionOptions;
  private deviceId: string;
  private mqttClient: MqttClient;
  private mqttTopic: string;

  constructor(
    private appMessagesService: AppMessagesService,
    private devicesService: DevicesService,
  ) {

    this.appMessagesService.currentMessage.pipe(
      filter( message => message ),
      filter( message => message.type === 'mqtt-send' )
    ).subscribe(
      resp => {
        this.sendData( resp.data );
      }
    );

  }

  async disconnect(): Promise<void> {
    await this.mqttClient.end();
  }

  getMqttClient( connectionArgs: MqttConnectionOptions ): MqttClient {
    return mqtt.connect( connectionArgs );
  }

  onClose(): void {
    console.log( 'Connection closed...' );
  }

  onConnect( success: boolean ) {
    if( success ) {

      console.log( 'Client connected...' );

      for( let device of deviceList ) {
        this.devicesService.addDevicesToStore( device );
      }

    } else {
      console.log( 'Client not connected...' );
    }
  }

  onError( error: string ): void {
    console.log( 'Connection error' , error );
  }

  onMessage( topic: string , message: string , packet: string ): void {
    console.log( topic , 'message received: ' , Buffer.from( message , 'base64' ).toString( 'ascii' ));
  }

  sendData( payload: any ): void {

    const jsonPayload = JSON.stringify( payload );

    console.log( this.mqttTopic , ': Publishing message:' , payload );
    this.mqttClient.publish( this.mqttTopic , jsonPayload , { qos: 1 });

  }

  async setupMqttClient( connectionArgs: MqttConnectionOptions , deviceId: string , mqttTopic: string ): Promise<void> {

    this.deviceId = deviceId;
    this.mqttTopic = mqttTopic;

    this.connectionArgs = connectionArgs;
    this.mqttClient = this.getMqttClient( connectionArgs );

    await this.mqttClient.subscribe( '/devices/' + this.deviceId + '/config' );

    this.mqttClient.on( 'close' , this.onClose.bind( this ));
    this.mqttClient.on( 'connect' , this.onConnect.bind( this ));
    this.mqttClient.on( 'error' , this.onError.bind( this ));
    this.mqttClient.on( 'message' , this.onMessage.bind( this ));

  }

}
