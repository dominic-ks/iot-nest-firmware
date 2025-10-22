import { Module, HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './services/auth/auth.service';
import { MqttHandlerService } from './services/mqtt-handler/mqtt-handler.service';
import { DevicesService } from './services/devices/devices.service';
import { DaikinAcService } from './services/daikin-ac/daikin-ac.service';
import { AppMessagesService } from './services/app-messages/app-messages.service';
import { UtilityService } from './services/utility/utility.service';
import { VirtualThermostatService } from './services/virtual-thermostat/virtual-thermostat.service';
import { HiveThermostatService } from './services/hive-thermostat/hive-thermostat.service';
import { Zigbee2mqttService } from './services/zigbee2mqtt/zigbee2mqtt.service';
import { HiveBulbService } from './services/hive-bulb/hive-bulb.service';
import { Pms5003Service } from './services/pms5003/pms5003.service';
import { SerialConnectorService } from './services/serial-connector/serial-connector.service';
import { Pms5003SerialService } from './services/pms5003-serial/pms5003-serial.service';
import { DummyDeviceService } from './services/dummy-device/dummy-device.service';
import { SonoffTempHumiditySensorService } from './services/sonoff-temp-humidity-sensor/sonoff-temp-humidity-sensor.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [
    AppService,
    AuthService,
    MqttHandlerService,
    DevicesService,
    DaikinAcService,
    AppMessagesService,
    UtilityService,
    VirtualThermostatService,
    HiveThermostatService,
    Zigbee2mqttService,
    HiveBulbService,
    Pms5003Service,
    SerialConnectorService,
    Pms5003SerialService,
    DummyDeviceService,
    SonoffTempHumiditySensorService
  ],
})
export class AppModule {}
