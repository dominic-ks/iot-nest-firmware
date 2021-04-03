import { Test, TestingModule } from '@nestjs/testing';
import { DaikinAcService } from './daikin-ac.service';

describe('DaikinAcService', () => {
  let service: DaikinAcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DaikinAcService],
    }).compile();

    service = module.get<DaikinAcService>(DaikinAcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
