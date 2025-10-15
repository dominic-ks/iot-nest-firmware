import { Test, TestingModule } from '@nestjs/testing';
import { DummyDeviceService } from './dummy-device.service';

describe('DummyDeviceService', () => {
  let service: DummyDeviceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DummyDeviceService],
    }).compile();

    service = module.get<DummyDeviceService>(DummyDeviceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
