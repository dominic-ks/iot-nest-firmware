import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { filter } from 'rxjs/operators';

import { MqttClient } from 'mqtt';
import { Algorithm } from 'jsonwebtoken';

import { AuthService } from './services/auth/auth.service';
import { MqttHandlerService } from './services/mqtt-handler/mqtt-handler.service';

import { MqttConnectionOptions } from './classes/mqtt-connection-options/mqtt-connection-options';

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

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
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

    this.setupDevice();

  }

  async setupDevice() {
    await this.mqttHandlerService.setupMqttClient( this.connectionArgs , this.deviceId , this.mqttTopic );
  }

}
