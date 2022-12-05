import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class ProfileDTO {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  welcomeTokens: number;
}
