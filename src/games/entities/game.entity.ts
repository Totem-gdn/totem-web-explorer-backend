import { ApiProperty } from '@nestjs/swagger';
import { SocialLink } from '../interfaces/socialLink';

class GameRecordGeneral {
  @ApiProperty()
  name: string;

  @ApiProperty()
  author: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  fullDescription: string;

  @ApiProperty()
  genre: string[];
}

class GameRecordAssets {
  @ApiProperty()
  avatars: number;

  @ApiProperty()
  items: number;
}

class GameRecordDetails {
  @ApiProperty()
  status: string;

  @ApiProperty()
  platforms: string[];

  @ApiProperty()
  madeWith: string;

  @ApiProperty()
  session: string;

  @ApiProperty()
  languages: string;

  @ApiProperty()
  inputs: string;
}

class GameRecordImages {
  @ApiProperty()
  coverImage: string;

  @ApiProperty()
  cardThumbnail: string;

  @ApiProperty()
  smallThumbnail: string;

  @ApiProperty()
  gallery: string[];
}

class GameRecordDNAFilters {
  @ApiProperty()
  avatarFilter: string;

  @ApiProperty()
  assetFilter: string;

  @ApiProperty()
  gemFilter: string;
}

class GameRecordConnections {
  @ApiProperty()
  webpage: string;

  @ApiProperty()
  assetRenderer: string;

  @ApiProperty()
  dnaFilters: GameRecordDNAFilters;

  @ApiProperty()
  promoVideo: string;

  @ApiProperty()
  socialLinks: SocialLink[];
}

class GameRecordContacts {
  @ApiProperty()
  email: string;

  @ApiProperty()
  discord: string;
}

export class GameRecordDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  owner: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  isLiked: boolean;

  @ApiProperty()
  players: number;

  @ApiProperty()
  likes: number;

  @ApiProperty()
  assets: GameRecordAssets;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  general: GameRecordGeneral;

  @ApiProperty()
  details: GameRecordDetails;

  @ApiProperty()
  images: GameRecordImages;

  @ApiProperty()
  connections: GameRecordConnections;

  @ApiProperty()
  contacts: GameRecordContacts;
}

class SmallGameRecordGeneral {
  @ApiProperty()
  name: string;

  @ApiProperty()
  genre: string[];
}

class SmallGameRecordImages {
  @ApiProperty()
  smallThumbnail: string;
}

class SmallGameRecordConnections {
  @ApiProperty()
  assetRenderer: string;
}

export class SmallGameRecordDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  general: SmallGameRecordGeneral;

  @ApiProperty()
  images: SmallGameRecordImages;

  @ApiProperty()
  connections: SmallGameRecordConnections;
}
