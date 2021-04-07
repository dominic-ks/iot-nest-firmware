import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe( 'AuthService' , () => {
  let service: AuthService;

  const privateKeyFile = 'D:/OneDrive/Dropbox Transfer/Business Plans/Web Development/Google Cloud/iot/device-001/rsa_private.pem';
  const testToken = {
    some: 'data',
  }

  beforeEach( async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService
      ],
    }).compile();

    service = module.get<AuthService>( AuthService );
  });

  it( 'should be defined' , () => {
    expect( service ).toBeDefined();
  });

  it( 'should create and decode a jwt' , () => {

    let token = service.createJwt( 'my-project' , privateKeyFile , 'RS256' );
    let decoded = service.validateJwt( token , privateKeyFile , 'RS256' );
    let failedDecoded = service.validateJwt( token , 'blahblahblah' , 'RS256' );

    expect( token ).toBeTruthy();
    expect( decoded ).toBeTruthy();
    expect( failedDecoded ).toBeFalsy();

  });

});
