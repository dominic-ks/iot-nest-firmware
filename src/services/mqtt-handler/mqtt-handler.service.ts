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

  private messageQueue: any[] = [];

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
        this.addToQueue( resp.data );
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

    setInterval(() => {
      this.sendData();
    }, 1500 )

  }

  addToQueue( payload: any ): void {
    this.messageQueue.push( payload );
  }

  disconnect(): void {
    this.mqttClient.end();
  }

  getMqttClient(): MqttClient {

    let tokenIsValid = false;

    if( this.authService.validateJwt( this.connectionArgs.password )) {
      tokenIsValid = true;
    }

    if( tokenIsValid && typeof( this.mqttClient ) !== 'undefined' ) {
      return this.mqttClient;
    }

    if( typeof( this.mqttClient ) !== 'undefined' ) {
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
    } else {
      console.log( 'Client not connected...' );
    }
  }

  onError( error: string ): void {
    console.log( 'MQTT connection error' , error );
  }

  onMessage( topic: string , message: string , packet: string ): void {

    const decodedMessage = Buffer.from( message , 'base64' ).toString( 'ascii' );

    if( topic === `/devices/${ this.deviceId }/config` ) {
      for( let device of JSON.parse( decodedMessage )) {
        this.devicesService.addDevicesToStore( device );
      }
    }

    if( topic === `/devices/${ this.deviceId }/commands` ) {
      this.devicesService.executeCommand( JSON.parse( decodedMessage ));
    }

  }

  removeMessageFromQueue( key: number ) {

  }

  sendData(): void {

    const mqttClient = this.getMqttClient();
    let queueSnapshot = [ ...this.messageQueue ];

    if( queueSnapshot.length !== 0 ) {

      const now = new Date().toISOString();
      const queuedMessage = queueSnapshot[0];
      const jsonPayload = JSON.stringify( queuedMessage );

      console.log( now + ': ' + this.mqttTopic , ': Publishing message' );
      mqttClient.publish( this.mqttTopic , jsonPayload , { qos: 1 });

      this.messageQueue.shift();

    }

  }

  setupMqttClient(): void {

    const mqttClient = this.getMqttClient();

    mqttClient.subscribe( '/devices/' + this.deviceId + '/config' , { qos: 1 });
    mqttClient.subscribe( '/devices/' + this.deviceId + '/commands/#' , { qos: 0 });

    mqttClient.on( 'close' , this.onClose.bind( this ));
    mqttClient.on( 'connect' , this.onConnect.bind( this ));
    mqttClient.on( 'error' , this.onError.bind( this ));
    mqttClient.on( 'message' , this.onMessage.bind( this ));

  }

}
