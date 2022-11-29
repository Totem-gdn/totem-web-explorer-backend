import { Controller, UseGuards, Get, Patch, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Web3AuthGuard } from './guards/web3auth.guard';
import { CurrentUser } from './decorators/currentUser';
import { IProfileResponse } from './interfaces/user-profile';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthEntity } from './entities/auth.entity';
import { AuthDTO } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(new Web3AuthGuard(false))
  @ApiOperation({ summary: 'Get my profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile information',
    type: AuthEntity,
  })
  async me(@CurrentUser() user: string): Promise<IProfileResponse> {
    return this.authService.getMe(user);
  }

  @Patch('me')
  @UseGuards(new Web3AuthGuard(false))
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile information',
    type: AuthEntity,
  })
  async update(@CurrentUser() user: string, @Body() payload: AuthDTO): Promise<IProfileResponse> {
    return this.authService.updateMe(user, payload);
  }
}
