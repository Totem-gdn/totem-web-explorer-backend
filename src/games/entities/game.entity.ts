import { ApiProperty } from '@nestjs/swagger';
import { SocialLink } from '../interfaces/socialLink';

class General {
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

class Assets {
  @ApiProperty()
  avatars: number;

  @ApiProperty()
  genre: number;
}

class Details {
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

class Images {
  @ApiProperty()
  coverImage: string;

  @ApiProperty()
  cardThumbnail: string;

  @ApiProperty()
  smallThumbnail: string;

  @ApiProperty()
  gallery: string[];
}

class DnaFilters {
  @ApiProperty()
  avatarFilter: string;

  @ApiProperty()
  assetFilter: string;

  @ApiProperty()
  gemFilter: string;
}

class Connections {
  @ApiProperty()
  webpage: string;

  @ApiProperty()
  assetRenderer: string;

  @ApiProperty()
  dnaFilters: DnaFilters;

  @ApiProperty()
  promoVideo: string;

  @ApiProperty()
  socialLinks: SocialLink[];
}

class Contacts {
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
  assets: Assets;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  general: General;

  @ApiProperty()
  details: Details;

  @ApiProperty()
  images: Images;

  @ApiProperty()
  connections: Connections;

  @ApiProperty()
  contacts: Contacts;
}

class SmallGeneral {
  @ApiProperty()
  name: string;

  @ApiProperty()
  genre: string[];
}

class SmallImages {
  @ApiProperty()
  smallThumbnail: string;
}

class SmallConnections {
  @ApiProperty()
  assetRenderer: string;
}

export class SmallGameRecordDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  general: SmallGeneral;

  @ApiProperty()
  images: SmallImages;

  @ApiProperty()
  connections: SmallConnections;
}
