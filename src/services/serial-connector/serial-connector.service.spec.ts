import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SerialConnectorService } from './serial-connector.service';

// Capture the line handler the service registers on the readline parser,
// so tests can feed it lines as if they came from the serial port.
let dataHandler: ( data: string ) => void;

jest.mock( '@serialport/parser-readline' , () => ({
  ReadlineParser: jest.fn(),
}));

jest.mock( 'serialport' , () => ({
  SerialPort: jest.fn().mockImplementation(() => ({
    pipe: jest.fn().mockReturnValue({
      on: jest.fn(( event: string , handler: ( data: string ) => void ) => {
        if( event === 'data' ) {
          dataHandler = handler;
        }
      }),
    }),
    on: jest.fn(),
    write: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('SerialConnectorService', () => {
  let service: SerialConnectorService;
  let received: unknown[];
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SerialConnectorService],
    }).compile();

    service = module.get<SerialConnectorService>(SerialConnectorService);

    received = [];
    service.messageStream$.subscribe(( message ) => {
      if( message !== null ) {
        received.push( message );
      }
    });

    warnSpy = jest.spyOn( Logger.prototype , 'warn' ).mockImplementation(() => undefined );
    jest.spyOn( Logger.prototype , 'log' ).mockImplementation(() => undefined );
    jest.spyOn( Logger.prototype , 'debug' ).mockImplementation(() => undefined );

    // The port opens on the first message sent.
    dataHandler = undefined;
    service.sendMessage({
      command: 'read-mq135',
      requestMeta: { requestID: 'req-1', requestService: 'mq135-serial' },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('opens the port on the first message and listens for lines', () => {
    expect( dataHandler ).toBeDefined();
  });

  it('ignores a non-JSON line without a warning', () => {
    dataHandler( 'read-mq135' );

    expect( warnSpy ).not.toHaveBeenCalled();
    expect( received ).toEqual([]);
  });

  it('ignores blank lines without a warning', () => {
    dataHandler( '' );
    dataHandler( '   ' );

    expect( warnSpy ).not.toHaveBeenCalled();
    expect( received ).toEqual([]);
  });

  it('delivers a JSON reply on the message stream', () => {
    const reply = {
      requestMeta: { requestID: 'req-1', requestService: 'mq135-serial' },
      status: 'ok',
      data: [ { ppm: 412.5 } ],
    };

    dataHandler( JSON.stringify( reply ));

    expect( warnSpy ).not.toHaveBeenCalled();
    expect( received ).toEqual([ reply ]);
  });

  it('delivers the JSON reply that follows a stray non-JSON line', () => {
    const reply = {
      requestMeta: { requestID: 'req-1', requestService: 'mq135-serial' },
      status: 'ok',
      data: [],
    };

    dataHandler( 'read-mq135' );
    dataHandler( JSON.stringify( reply ));

    expect( warnSpy ).not.toHaveBeenCalled();
    expect( received ).toEqual([ reply ]);
  });

  it('still warns when a line that looks like JSON fails to parse', () => {
    dataHandler( '{"status":"ok",' );

    expect( warnSpy ).toHaveBeenCalledTimes( 1 );
    expect( warnSpy.mock.calls[0][0] ).toContain( 'Error parsing JSON' );
    expect( received ).toEqual([]);
  });
});
