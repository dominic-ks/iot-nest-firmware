import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { filter } from 'rxjs/operators';

import { Algorithm } from 'jsonwebtoken';

import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { AuthService } from '../auth/auth.service';
import { DevicesService } from '../devices/devices.service';

import { AppMessage } from '../../classes/app-message/app-message';
import { MqttConnectionOptions } from '../../classes/mqtt-connection-options/mqtt-connection-options';

const deviceList = require( '../../../devices.json' );

@Injectable()
export class MqttHandlerService {

  private algorithm: Algorithm;
  private cloudRegion: string;
  private connectionArgs: MqttConnectionOptions;
  private deviceId: string;
  private messageType: string;
  private mqttClientId: string;
  private mqttClient: MqttClient;
  private mqttHost: string;
  private mqttPort: number;
  private mqttTopic: string;
  private privateKeyFile: string;
  private projectId: string;
  private registryId: string;

  private messageQueue: any[];

  constructor(
    private appMessagesService: AppMessagesService,
    private authService: AuthService,
    private configService: ConfigService,
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

    this.algorithm = this.configService.get<Algorithm>( 'ALGORHYTHM' );
    this.cloudRegion = this.configService.get<string>( 'CLOUDREGION' );
    this.deviceId = this.configService.get<string>( 'DEVICEID' );
    this.messageType = this.configService.get<string>( 'MESSAGETYPE' );
    this.mqttHost = this.configService.get<string>( 'MQTTHOST' );
    this.mqttPort = this.configService.get<number>( 'MQTTPORT' );
    this.privateKeyFile = this.configService.get<string>( 'PRIVATEKEYFILE' );
    this.projectId = this.configService.get<string>( 'PROJECTID' );
    this.registryId = this.configService.get<string>( 'REGISTRYID' );

    this.mqttClientId = 'projects/' + this.projectId + '/locations/' + this.cloudRegion + '/registries/' + this.registryId + '/devices/' + this.deviceId;
    this.mqttTopic = '/devices/' + this.deviceId + '/' + this.messageType;

    this.connectionArgs = {
      host: this.mqttHost,
      port: this.mqttPort,
      clientId: this.mqttClientId,
      username: 'unused',
      password: this.authService.createJwt( this.projectId , this.privateKeyFile , this.algorithm ),
      protocol: 'mqtts',
      secureProtocol: 'TLSv1_2_method'
    };

  }

  disconnect(): void {
    this.mqttClient.end();
  }

  getMqttClient(): MqttClient {

    let tokenIsValid = false;

    if( this.authService.validateJwt( this.connectionArgs.password , this.privateKeyFile , this.algorithm )) {
      console.log( 'jwt is valid' );
      tokenIsValid = true;
    }

    if( ! tokenIsValid && typeof( this.mqttClient ) !== 'undefined' ) {
      this.mqttClient.end();
    }

    if( ! tokenIsValid ) {
      console.log( 'refreshing jwt' );
      this.connectionArgs.password = this.authService.createJwt( this.projectId , this.privateKeyFile , this.algorithm );
      this.connectionArgs.clean = true;
    }

    return this.mqttClient = mqtt.connect( this.connectionArgs );

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
    console.log( 'MQTT connection error' , error );
  }

  onMessage( topic: string , message: string , packet: string ): void {
    console.log( topic , 'message received: ' , Buffer.from( message , 'base64' ).toString( 'ascii' ));
  }

  sendData( payload: any ): void {

    const mqttClient = this.getMqttClient();
    const jsonPayload = JSON.stringify( payload );

    console.log( this.mqttTopic , ': Publishing message' );
    mqttClient.publish( this.mqttTopic , jsonPayload , { qos: 1 });

  }

  setupMqttClient(): void {

    const mqttClient = this.getMqttClient();

    mqttClient.subscribe( '/devices/' + this.deviceId + '/config' );

    mqttClient.on( 'close' , this.onClose.bind( this ));
    mqttClient.on( 'connect' , this.onConnect.bind( this ));
    mqttClient.on( 'error' , this.onError.bind( this ));
    mqttClient.on( 'message' , this.onMessage.bind( this ));

  }

}
