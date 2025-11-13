import { Test, TestingModule } from '@nestjs/testing';
import { Mq135SerialService } from './mq135-serial.service';

describe('Mq135SerialService', () => {
  let service: Mq135SerialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Mq135SerialService],
    }).compile();

    service = module.get<Mq135SerialService>(Mq135SerialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
