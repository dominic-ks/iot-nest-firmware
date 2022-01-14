import { Test, TestingModule } from '@nestjs/testing';
import { VirtualThermostatService } from './virtual-thermostat.service';

describe('VirtualThermostatService', () => {
  let service: VirtualThermostatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VirtualThermostatService],
    }).compile();

    service = module.get<VirtualThermostatService>(VirtualThermostatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
