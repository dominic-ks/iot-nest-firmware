import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';

import { AppMessage } from '../../classes/app-message/app-message';

@Injectable()
export class AppMessagesService {

  private message = new BehaviorSubject( null );
  public currentMessage = this.message.asObservable();

  broadcastMessage( message: AppMessage ): void {
    this.message.next( message );
    this.message.next({
      data: false,
      type: 'clear',
    });
  }

}
