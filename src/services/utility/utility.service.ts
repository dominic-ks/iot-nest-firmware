import { Injectable, HttpService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { SerialConnectorService } from '../serial-connector/serial-connector.service';

@Injectable()
export class UtilityService {

  constructor(
    public appMessagesService: AppMessagesService,
    public configService: ConfigService,
    public httpService: HttpService,
    public serialConnectorService: SerialConnectorService,
  ) { }

  get( property: string ): any {
    return this[ property ];
  }

  set( property: string , value: any ): void {
    this[ property ] = value;
  }

}
