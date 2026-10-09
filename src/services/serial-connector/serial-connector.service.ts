import { Injectable , OnModuleDestroy , Logger } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline'; // Import ReadlineParser correctly

import { SerialDeviceRequest } from 'src/classes/serial-device-request/serial-device-request';
import { SerialDeviceResponse } from 'src/classes/serial-device-response/serial-device-response';

@Injectable()
export class SerialConnectorService implements OnModuleDestroy {

  private messageStreamSubject = new BehaviorSubject<SerialDeviceResponse>( null );
  private port: SerialPort;
  private parser: ReadlineParser;
  private readonly logger = new Logger( SerialConnectorService.name );

  // Opened lazily on first use, so devices without serial sensors never touch the port
  // (on device-003 /dev/ttyACM0 is the Zigbee coordinator).
  private readonly serialPortPath = process.env.SERIAL_DEVICE_PATH || '/dev/ttyACM0';
  private readonly baudRate = 9600;

  public messageStream$: Observable<SerialDeviceResponse> = this.messageStreamSubject.asObservable();

  private openPort(): void {
    this.port = new SerialPort({
      path: this.serialPortPath,
      baudRate: this.baudRate,
    });

    this.parser = this.port.pipe( new ReadlineParser({ delimiter: '\r\n' }) ); // Use ReadlineParser

    this.parser.on( 'data' , ( data: string ) => {

      this.logger.log( `Received: ${data}` );

      try {
        this.messageStreamSubject.next( JSON.parse( data ));
      } catch( err ) {
        this.logger.warn( `Error parsing JSON: ${err.message}, with string: ${data}` );
      }
      
    });

    this.port.on( 'error' , ( err: Error ) => {
      this.logger.error( `Error: ${err.message}` );
    });

    this.logger.log( 'Serial port initialized' );
  }

  async onModuleDestroy() {
    if( this.port ) {
      await this.port.close();
      this.logger.log( 'Serial port closed' );
    }
  }

  sendMessage( request: SerialDeviceRequest ): void {

    const message = JSON.stringify( request );

    if( typeof( this.port ) === 'undefined' ) {
      this.openPort();
    }

    this.port.write( message + '\r\n' , ( err ) => {
      if( err ) {
        return this.logger.error( `Error on write: ${err.message}` );
      }
      this.logger.log( `Sent: ${message}` );
    });

  }

}
