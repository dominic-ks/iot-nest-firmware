import { Injectable, HttpService } from '@nestjs/common';

import { AppMessagesService } from '../app-messages/app-messages.service';

@Injectable()
export class UtilityService {

  constructor(
    public appMessagesService: AppMessagesService,
    public httpService: HttpService,
  ) { }

  get( property: string ): any {
    return this[ property ];
  }

}
