import { Test, TestingModule } from '@nestjs/testing';
import { Mics6814SerialService } from './mics6814-serial.service';

describe('Mics6814SerialService', () => {
  let service: Mics6814SerialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Mics6814SerialService],
    }).compile();

    service = module.get<Mics6814SerialService>(Mics6814SerialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
