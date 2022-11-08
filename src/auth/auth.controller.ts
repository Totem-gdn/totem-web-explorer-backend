import { Controller, UseGuards, Get, Patch, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Web3AuthGuard } from './guards/web3auth.guard';
import { CurrentUser } from './decorators/currentUser';
import { IMeResponse } from './interfaces/user-profile';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(new Web3AuthGuard(false))
  async me(@CurrentUser() user: string): Promise<IMeResponse> {
    return this.authService.getMe(user);
  }

  @Patch('me')
  @UseGuards(new Web3AuthGuard(false))
  async update(@CurrentUser() user: string, @Body() payload: IMeResponse): Promise<IMeResponse> {
    return this.authService.updateMe(user, payload);
  }
}
