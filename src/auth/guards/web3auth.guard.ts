import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import * as jose from 'jose';
import { ethers } from 'ethers';

@Injectable()
export class Web3AuthGuard implements CanActivate {
  static UserKey = 'user';
  static XHeaders = {
    PubKey: 'x-app-pubkey',
    PubAddress: 'x-app-address',
  };

  private readonly logger = new Logger(Web3AuthGuard.name);
  private readonly allowUnauthorized: boolean = false;
  private readonly OpenLoginJWKSetUrl = new URL('https://api.openlogin.com/jwks');
  private readonly Web3AuthJWKSetUrl = new URL('https://authjs.web3auth.io/jwks');

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
    try {
      const authHeader = authorizationHeader.split(' ');
      if (authHeader.length < 2) {
        return false;
      }
      const idToken = authHeader[1];
      const jwtPayload = jose.decodeJwt(idToken);

      let JWKS;
      if (jwtPayload.iss === 'metamask') {
        JWKS = jose.createRemoteJWKSet(new URL('https://authjs.web3auth.io/jwks'));
      } else {
        JWKS = jose.createRemoteJWKSet(jwtPayload.issuer ? this.Web3AuthJWKSetUrl : this.OpenLoginJWKSetUrl);
      }
      const jwtDecode = await jose.jwtVerify(idToken, JWKS, { algorithms: ['ES256'] });
      const appPubKey =
        authHeader[2] ||
        (request.headers[Web3AuthGuard.XHeaders.PubKey] as string) ||
        (request.headers[Web3AuthGuard.XHeaders.PubAddress] as string);
      if (!appPubKey) {
        return false;
      }
      for (const wallet of (jwtDecode.payload as any).wallets) {
        if (wallet.public_key === appPubKey || wallet.address === appPubKey) {
          request[Web3AuthGuard.UserKey] = wallet.address || ethers.utils.computeAddress(`0x${appPubKey}`);
          return true;
        }
      }
      return false;
    } catch (err) {
      if (err instanceof jose.errors.JWTExpired) {
        return this.allowUnauthorized;
      }
      this.logger.error(err);
      return false;
    }
  }
}
