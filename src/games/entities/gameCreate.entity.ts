import { ApiProperty } from '@nestjs/swagger';

class dnaFilters {
  @ApiProperty()
  avatarFilter: string;

  @ApiProperty()
  assetFilter: string;

  @ApiProperty()
  gemFilter: string;
}

class connections {
  @ApiProperty()
  dnaFilters: dnaFilters;
}

class uploadImageURLs {
  @ApiProperty()
  coverImage: string;

  @ApiProperty()
  cardThumbnail: string;

  @ApiProperty()
  smallThumbnail: string;

  @ApiProperty()
  imagesGallery: string[];
}

export class GameCreateEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  connections: connections;

  @ApiProperty()
  uploadImageURLs: uploadImageURLs;
}
