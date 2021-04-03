import { Injectable } from '@nestjs/common';

import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';

import { MqttConnectionOptions } from '../../classes/mqtt-connection-options/mqtt-connection-options';

@Injectable()
export class MqttHandlerService {

  getMqttClient( connectionArgs: MqttConnectionOptions ): any {
    return mqtt.connect( connectionArgs );
  }

}
