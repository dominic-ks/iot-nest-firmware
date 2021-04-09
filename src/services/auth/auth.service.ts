import { Injectable } from '@nestjs/common';
import { Algorithm, decode, sign , verify } from 'jsonwebtoken';
import * as fs from 'fs';

@Injectable()
export class AuthService {

  constructor() { }

  createJwt( projectId: string , privateKeyFile: string , algorithm: Algorithm ): string {

    const iat: number = Date.now() / 1000 ;
    const exp: number = Math.round(( Date.now() / 1000 ) + 20 * 60 );

    const token = {
      iat: iat,
      exp: exp,
      aud: projectId
    };

    const privateKey = fs.readFileSync( privateKeyFile );

    return sign( token , privateKey , {
      algorithm: algorithm
    });

  }

  validateJwt( jwt: string ): boolean {

    try {

      const decodedToken = decode( jwt )
      const now = Date.now() / 1000;
      const timeSinceExp = now - decodedToken['exp'];

      if( timeSinceExp > 0 ) {
        return false;
      };

      return true;

    }

    catch( e ) {
      console.log( 'JWT Validation Error: ' , e );
      return false;
    }

  }

}
