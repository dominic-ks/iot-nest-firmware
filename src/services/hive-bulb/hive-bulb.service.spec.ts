import { Test, TestingModule } from '@nestjs/testing';
import { HiveBulbService } from './hive-bulb.service';

describe('HiveBulbService', () => {
  let service: HiveBulbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HiveBulbService],
    }).compile();

    service = module.get<HiveBulbService>(HiveBulbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
