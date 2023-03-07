import { Controller, UseGuards, Get, Patch, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Web3AuthGuard } from './guards/web3auth.guard';
import { CurrentUser } from './decorators/currentUser';
import { IProfileResponse } from './interfaces/user-profile';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfileEntity } from './entities/auth.entity';
import { ProfileDTO } from './dto/auth.dto';

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
    type: ProfileEntity,
  })
  @ApiHeader({ name: 'Authorization', required: true, description: 'Authorization token' })
  async me(@CurrentUser() user: string): Promise<IProfileResponse> {
    return this.authService.getMe(user);
  }

  @Patch('me')
  @UseGuards(new Web3AuthGuard(false))
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile information',
    type: ProfileEntity,
  })
  @ApiHeader({ name: 'Authorization', required: true, description: 'Authorization token' })
  async update(@CurrentUser() user: string, @Body() payload: ProfileDTO): Promise<IProfileResponse> {
    return this.authService.updateMe(user, payload);
  }
}
