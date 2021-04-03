import { Test, TestingModule } from '@nestjs/testing';
import { MqttHandlerService } from './mqtt-handler.service';

describe('MqttHandlerService', () => {
  let service: MqttHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MqttHandlerService],
    }).compile();

    service = module.get<MqttHandlerService>(MqttHandlerService);
  });

  it( 'should be defined' , () => {
    expect( service) .toBeDefined();
  });
});
