import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { filter } from 'rxjs/operators';

import { MqttClient } from 'mqtt';
import { Algorithm } from 'jsonwebtoken';

import { AuthService } from './services/auth/auth.service';
import { DevicesService } from './services/devices/devices.service';
import { MqttHandlerService } from './services/mqtt-handler/mqtt-handler.service';

import { Device } from './classes/device/device';
import { MqttConnectionOptions } from './classes/mqtt-connection-options/mqtt-connection-options';

import { VirtualDevice } from './interfaces/virtual-device.interface';

@Controller()
export class AppController {

  private algorithm: Algorithm;
  private cloudRegion: string;
  private connectionArgs: MqttConnectionOptions;
  private deviceId: string;
  private messageType: string;
  private mqttClient: MqttClient;
  private mqttClientId: string;
  private mqttHost: string;
  private mqttPort: number;
  private mqttTopic: string;
  private privateKeyFile: string;
  private projectId: string;
  private registryId: string;
  private virtualDevices: VirtualDevice[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly devicesService: DevicesService,
    private readonly mqttHandlerService: MqttHandlerService,
  ) {

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

    this.devicesService.currentDevices.pipe(
      filter( resp => resp )
    ).subscribe(
      ( resp: VirtualDevice[] ) => {
        this.virtualDevices = resp;
      }
    );

    this.setupMqttClient();

  }

  setupMqttClient(): boolean {

    this.mqttClient = this.mqttHandlerService.getMqttClient( this.connectionArgs );

    this.mqttClient.subscribe( '/devices/' + this.deviceId + '/config' );

    this.mqttClient.on( 'connect' , ( success ) => {
      if( success ) {
        console.log( 'Client connected...' );
        this.sendData();
      } else {
        console.log( 'Client not connected...' );
      }
    });

    this.mqttClient.on( 'close' , () => {
      console.log( 'close' );
    });

    this.mqttClient.on( 'error' , ( err: string ) => {
      console.log( 'error' , err );
    });

    this.mqttClient.on( 'message' , ( topic: string , message: string , packet: string ) => {
      console.log( topic , 'message received: ' , Buffer.from( message , 'base64' ).toString( 'ascii' ));
    });

    return true;

  }

  sendData() {

    for( let virtualDevice of this.virtualDevices ) {

      const payload = virtualDevice.getTelemtryData();
      const jsonPayload = JSON.stringify( payload );

      console.log( this.mqttTopic , ': Publishing message:' , payload );
      this.mqttClient.publish( this.mqttTopic , jsonPayload , { qos: 1 });

    }

    console.log( 'Transmitting in 30 seconds' );
    setTimeout(() => {
      this.sendData()
    }, 30000 );

  }

}
