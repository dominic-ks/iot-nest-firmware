import { Test, TestingModule } from '@nestjs/testing';
import { Pms5003Service } from './pms5003.service';

describe('Pms5003Service', () => {
  let service: Pms5003Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Pms5003Service],
    }).compile();

    service = module.get<Pms5003Service>(Pms5003Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
