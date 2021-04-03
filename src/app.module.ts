import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './services/auth/auth.service';
import { MqttHandlerService } from './services/mqtt-handler/mqtt-handler.service';
import { DevicesService } from './services/devices/devices.service';
import { DaikinAcService } from './services/daikin-ac/daikin-ac.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
  ],
  controllers: [
    AppController,
  ],
  providers: [
    AppService,
    AuthService,
    MqttHandlerService,
    DevicesService,
    DaikinAcService
  ],
})
export class AppModule {}
