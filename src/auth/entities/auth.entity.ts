import { ApiProperty } from '@nestjs/swagger';

export class ProfileAssetMetadata {
  @ApiProperty()
  all: number;

  @ApiProperty()
  rare: number;

  @ApiProperty()
  unique: number;
}

export class ProfileEntity {
  @ApiProperty()
  publicKey: string;

  @ApiProperty()
  welcomeTokens: number;

  @ApiProperty()
  items: ProfileAssetMetadata;

  @ApiProperty()
  avatars: ProfileAssetMetadata;

  @ApiProperty()
  gems: ProfileAssetMetadata;
}
