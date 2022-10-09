import { Test, TestingModule } from '@nestjs/testing';
import { HiveThermostatService } from './hive-thermostat.service';

describe('HiveThermostatService', () => {
  let service: HiveThermostatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HiveThermostatService],
    }).compile();

    service = module.get<HiveThermostatService>(HiveThermostatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
