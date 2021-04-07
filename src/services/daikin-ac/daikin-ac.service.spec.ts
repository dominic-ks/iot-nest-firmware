import { Test, TestingModule } from '@nestjs/testing';
import { Observable } from 'rxjs';
import { DaikinAcService } from './daikin-ac.service';

import { UtilityService } from '../utility/utility.service';

describe( 'DaikinAcService' , () => {
  let service: DaikinAcService;

  beforeEach( async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DaikinAcService,
        { provide: UtilityService , useValue: {
          appMessagesService: {
            broadcastMessage: () => true,
          },
          httpService: {
            get: () => {
              return new Observable( subscriber => {
                subscriber.next({
                  data: 'key1=value1,key2=value2'
                });
                subscriber.complete();
              });
            },
          },
        }},
      ],
    }).compile();

    service = module.get<DaikinAcService>( DaikinAcService );
  });

  it( 'should be defined' , () => {
    expect( service ).toBeDefined();
  });
});
