import { Test, TestingModule } from '@nestjs/testing';
import { AppMessagesService } from './app-messages.service';

describe('AppMessagesService', () => {
  let service: AppMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppMessagesService],
    }).compile();

    service = module.get<AppMessagesService>(AppMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
