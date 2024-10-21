import { Test, TestingModule } from '@nestjs/testing';
import { SerialConnectorService } from './serial-connector.service';

describe('SerialConnectorService', () => {
  let service: SerialConnectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SerialConnectorService],
    }).compile();

    service = module.get<SerialConnectorService>(SerialConnectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
