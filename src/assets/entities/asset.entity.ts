import { ApiProperty } from '@nestjs/swagger';

export class AssetEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  owner: string;

  @ApiProperty()
  owners: string[];

  @ApiProperty()
  tokenId: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  isLiked: boolean;

  @ApiProperty()
  likes: number;

  @ApiProperty()
  games: number;

  @ApiProperty()
  lastUsed: string;
}
