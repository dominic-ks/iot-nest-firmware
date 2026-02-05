import { Test, TestingModule } from '@nestjs/testing';
import { Dht22SerialService } from './dht22-serial.service';

describe('Dht22SerialService', () => {
  let service: Dht22SerialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Dht22SerialService],
    }).compile();

    service = module.get<Dht22SerialService>(Dht22SerialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});