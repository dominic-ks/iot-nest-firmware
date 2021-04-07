import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/common';
import { Observable } from 'rxjs';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { UtilityService } from './utility.service';

describe( 'UtilityService' , () => {
  let service: UtilityService;

  beforeEach( async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
      ],
      providers: [
        AppMessagesService,
        UtilityService,
        { provide: HttpService , useValue: {
          get: () => {
            return new Observable( subscriber => {
              subscriber.next({
                data: 'key1=value1,key2=value2'
              });
              subscriber.complete();
            });
          },
        }},
      ],
    }).compile();

    service = module.get<UtilityService>( UtilityService );
  });

  it( 'should be defined' , () => {
    expect( service ).toBeDefined();
  });
});
