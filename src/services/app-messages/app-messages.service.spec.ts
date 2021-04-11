import { Test, TestingModule } from '@nestjs/testing';
import { filter, take } from 'rxjs/operators';

import { AppMessagesService } from './app-messages.service';

describe( 'AppMessagesService', () => {
  let service: AppMessagesService;

  let testMessage = {
    data: {
      some: 'data',
    },
    type: 'test',
  }

  let clearMessage = {
    data: false,
    type: 'clear',
  }

  beforeEach( async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppMessagesService
      ],
    }).compile();

    service = module.get<AppMessagesService>( AppMessagesService );
  });

  it( 'should be defined' , () => {
    expect( service ).toBeDefined();
  });

  it( 'should update the current message' , () => {

    service.currentMessage.pipe(
      filter( resp => resp ),
      take( 1 )
    ).subscribe(
      resp => {
        expect( resp ).toEqual( testMessage );
      }
    );

    service.broadcastMessage( testMessage );

  });

  it( 'should receive a clear message' , () => {
    
    service.currentMessage.pipe(
      filter( resp => resp ),
      take( 1 )
    ).subscribe(
      resp => {
        expect( resp ).toEqual( clearMessage );
      }
    );

  })

});
