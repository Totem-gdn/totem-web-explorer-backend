import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Web3AuthGuard } from '../guards/web3auth.guard';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): any => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return req[Web3AuthGuard.UserKey] || '';
});
