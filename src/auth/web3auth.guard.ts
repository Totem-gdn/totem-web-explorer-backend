import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import * as jose from 'jose';

@Injectable()
export class Web3authGuard implements CanActivate {
  private readonly allowUnauthorized: boolean = false;
  private readonly remoteJWKSetUrl = new URL('https://api.openlogin.com/jwks');

  constructor(allowUnauthorized?: boolean) {
    this.allowUnauthorized = allowUnauthorized;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    return this.validateRequest(request);
  }

  private async validateRequest(request: Request): Promise<boolean> {
    const authorizationHeader = request.headers.authorization;
    if (!authorizationHeader) {
      return this.allowUnauthorized;
    }
    const auth = authorizationHeader.split(' ');
    if (auth.length < 2) {
      return false;
    }
    const idToken = auth[1];
    const jwtDecode = await jose.jwtVerify(idToken, jose.createRemoteJWKSet(this.remoteJWKSetUrl), {
      algorithms: ['ES256'],
    });
    const appPubKey = auth[2] || (request.headers['x-app-pubkey'] as string);
    if (!appPubKey) {
      return false;
    }
    if ((jwtDecode.payload as any).wallets[0].public_key === appPubKey) {
      request['user'] = appPubKey;
      return true;
    }
    return false;
  }
}
