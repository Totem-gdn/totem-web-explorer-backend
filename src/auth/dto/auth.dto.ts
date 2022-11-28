import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class AuthDTO {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  welcomeTokens: number;
}
