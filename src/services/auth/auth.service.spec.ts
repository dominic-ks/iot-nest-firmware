import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

import { sign } from 'jsonwebtoken';
import * as fs from 'fs';

describe( 'AuthService' , () => {
  let service: AuthService;

  const privateKeyFile = 'D:/OneDrive/Dropbox Transfer/Business Plans/Web Development/Google Cloud/iot/device-001/rsa_private.pem';
  const testToken = {
    some: 'data',
  }

  const validToken = sign({
    iat: Math.round(( Date.now() / 1000 ) + 0 * 60 ),
    exp: Math.round(( Date.now() / 1000 ) + 20 * 60 ),
    aud: 'my-audience',
  }, fs.readFileSync( privateKeyFile ) , {
    algorithm: 'RS256'
  });

  const expiredToken = sign({
    iat: Math.round(( Date.now() / 1000 ) - 21 * 60 ),
    exp: Math.round(( Date.now() / 1000 ) - 1 * 60 ),
    aud: 'my-audience',
  }, fs.readFileSync( privateKeyFile ) , {
    algorithm: 'RS256'
  });

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

  it( 'should validate a token that has not expired' , () => {
    let validatedToken = service.validateJwt( validToken , privateKeyFile , 'RS256' );
    expect( validatedToken ).toBeTruthy();
  });

  it( 'should fail to validate an expired token' , () => {
    let failedDecoded = service.validateJwt( expiredToken , privateKeyFile , 'RS256' );
    expect( failedDecoded ).toBeFalsy();
  });

});
