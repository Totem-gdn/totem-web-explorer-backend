import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import * as jose from 'jose';
import { ethers } from 'ethers';

@Injectable()
export class Web3AuthGuard implements CanActivate {
  static UserKey = 'user';
  static XHeaders = {
    PubKey: 'x-app-pubkey',
  };

  private readonly logger = new Logger(Web3AuthGuard.name);
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
    try {
      const authHeader = authorizationHeader.split(' ');
      if (authHeader.length < 2) {
        return false;
      }
      const idToken = authHeader[1];
      const jwtDecode = await jose.jwtVerify(idToken, jose.createRemoteJWKSet(this.remoteJWKSetUrl), {
        algorithms: ['ES256'],
      });
      const appPubKey = authHeader[2] || (request.headers[Web3AuthGuard.XHeaders.PubKey] as string);
      if (!appPubKey) {
        return false;
      }
      if ((jwtDecode.payload as any).wallets[0].public_key === appPubKey) {
        request[Web3AuthGuard.UserKey] = ethers.utils.computeAddress(`0x${appPubKey}`);
        return true;
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
