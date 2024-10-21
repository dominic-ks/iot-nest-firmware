import { Test, TestingModule } from '@nestjs/testing';
import { Pms5003SerialService } from './pms5003-serial.service';

describe('Pms5003SerialService', () => {
  let service: Pms5003SerialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Pms5003SerialService],
    }).compile();

    service = module.get<Pms5003SerialService>(Pms5003SerialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
