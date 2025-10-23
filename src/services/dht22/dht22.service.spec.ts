import { Test, TestingModule } from '@nestjs/testing';
import { Dht22Service } from './dht22.service';

describe('Dht22Service', () => {
  let service: Dht22Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Dht22Service],
    }).compile();

    service = module.get<Dht22Service>(Dht22Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
