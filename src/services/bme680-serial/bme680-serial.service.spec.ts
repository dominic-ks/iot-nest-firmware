import { Test, TestingModule } from '@nestjs/testing';
import { Bme680SerialService } from './bme680-serial.service';

describe('Bme680SerialService', () => {
  let service: Bme680SerialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Bme680SerialService],
    }).compile();

    service = module.get<Bme680SerialService>(Bme680SerialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
