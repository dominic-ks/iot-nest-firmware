import { Test, TestingModule } from '@nestjs/testing';
import { Dht22DeviceService } from './dht22-device.service';

describe('Dht22DeviceService', () => {
  let service: Dht22DeviceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Dht22DeviceService],
    }).compile();

    service = module.get<Dht22DeviceService>(Dht22DeviceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});