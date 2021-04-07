import { Controller, Get } from '@nestjs/common';
import { filter } from 'rxjs/operators';

import { MqttHandlerService } from './services/mqtt-handler/mqtt-handler.service';

@Controller()
export class AppController {

  constructor(
    private readonly mqttHandlerService: MqttHandlerService,
  ) {
    this.setupDevice();
  }

  setupDevice() {
    this.mqttHandlerService.setupMqttClient();
  }

}
