import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subscription } from 'rxjs';

import { VirtualDevice } from '../../interfaces/virtual-device.interface';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { SerialConnectorService } from '../serial-connector/serial-connector.service';
import { UtilityService } from '../utility/utility.service';

import { Device } from '../../classes/device/device';
import { filter } from 'rxjs/operators';

class Pms5003SerialDevice extends Device {
  address: string;
  id: string;
  interval: number;
  parent: string;
  type: string;
}

class Pms5003SerialCommandData {
  slug: string;
  value: any;
}

@Injectable()
export class Pms5003SerialService implements OnModuleDestroy, VirtualDevice {

  private appMessagesService: AppMessagesService;
  private serialConnectorService: SerialConnectorService;

  private readonly logger = new Logger( Pms5003SerialService.name );
  private subscriptions: Subscription = new Subscription();

  public deviceInfo: Device;

  constructor(
    private utilityService: UtilityService,
  ) {

    this.appMessagesService = this.utilityService.appMessagesService;
    this.serialConnectorService = this.utilityService.serialConnectorService;

    this.subscriptions.add(
      this.serialConnectorService.messageStream$.pipe(
        filter( message => typeof( message ) === 'object' ),
        filter(() => typeof( this.deviceInfo ) !== 'undefined' ),
        filter( message => this.validateResponse( message )),
      ).subscribe( message => {
        this.setDeviceData( message );
      })
    );

  }

  onModuleDestroy() {
    this.subscriptions.unsubscribe();
  }

  executeDeviceCommand: ( commandData: any ) => void;

  getDeviceTypeName(): string {
    return 'Particulate Sensor PMS5003 (Serial)';
  }

  getSensorInfo(): void {
    this.serialConnectorService.sendMessage({ 
      command:'read-pms5003',
      requestMeta: {
        requestID: [ this.deviceInfo.id , Date.now() ].join( '%' ),
        requestService: Pms5003SerialService.name,
      }
    });
  }

  sendData() {
    this.appMessagesService.broadcastMessage({
      data: this.deviceInfo,
      type: 'mqtt-send',
    });
  }

  setDevice( device: Pms5003SerialDevice ): void {

    this.updateDeviceData( device );
    
    setInterval(() => {
      this.getSensorInfo();
    }, this.deviceInfo.interval );

  }

  setDeviceData( data: any ) {

    let dataChanged = false;

    if( typeof( this.deviceInfo.data ) === 'undefined' ) {
      this.deviceInfo.data = {};
    }

    for( let deviceProperty in data ) {
      let devicePropertyValue = data[ deviceProperty ];

      if( typeof( this.deviceInfo.data[ deviceProperty ]) !== 'undefined' && this.deviceInfo.data[ deviceProperty ] === devicePropertyValue ) {
        continue;
      }

      dataChanged = true;
      this.deviceInfo.data[ deviceProperty ] = devicePropertyValue;

    }

    if( ! dataChanged ) {
      return;
    }

    this.sendData();

  }

  validateResponse( message: any ): boolean {

    if( message === null ) {
      this.logger.log( 'Message is null' );
      return false;
    }
    
    if( typeof( message.requestMeta ) === 'undefined' ) {
      this.logger.log( 'No requestMeta' );
      return false;
    }

    if( typeof( message.requestMeta.requestID ) === 'undefined' || typeof( message.requestMeta.requestService ) === 'undefined' ) {
      this.logger.log( 'Invalid requestMeta' );
      return false;
    }

    if( message.requestMeta.requestService !== Pms5003SerialService.name ) {
      this.logger.log( 'Invalid requestService' );
      return false;
    }

    const requestIdSplit = message.requestMeta.requestID.split( '%' );
    const requestPrefix = requestIdSplit[0];

    if( requestPrefix !== this.deviceInfo.id ) {
      this.logger.log( 'Invalid requestID:' , message.requestMeta.requestID ); 
      return false;
    }

    return true;
    
  }

  updateDeviceData( device: Pms5003SerialDevice ): void {
    this.deviceInfo = device;
  }

}
