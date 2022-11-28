import { ApiProperty } from '@nestjs/swagger';

export class AuthEntity {
  @ApiProperty()
  publicKey: string;

  @ApiProperty()
  welcomeTokens: number;
}
