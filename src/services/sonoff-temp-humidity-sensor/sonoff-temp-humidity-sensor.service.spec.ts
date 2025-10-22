import { Test, TestingModule } from '@nestjs/testing';
import { SonoffTempHumiditySensorService } from './sonoff-temp-humidity-sensor.service';

describe('SonoffTempHumiditySensorService', () => {
  let service: SonoffTempHumiditySensorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SonoffTempHumiditySensorService],
    }).compile();

    service = module.get<SonoffTempHumiditySensorService>(SonoffTempHumiditySensorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
