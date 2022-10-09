import { Test, TestingModule } from '@nestjs/testing';
import { Zigbee2mqttService } from './zigbee2mqtt.service';

describe('Zigbee2mqttService', () => {
  let service: Zigbee2mqttService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Zigbee2mqttService],
    }).compile();

    service = module.get<Zigbee2mqttService>(Zigbee2mqttService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
