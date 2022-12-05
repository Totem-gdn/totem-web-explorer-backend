import { ApiProperty } from '@nestjs/swagger';

class GameCreateEntityDNAFilters {
  @ApiProperty()
  avatarFilter: string;

  @ApiProperty()
  assetFilter: string;

  @ApiProperty()
  gemFilter: string;
}

class GameCreateEntityConnections {
  @ApiProperty()
  dnaFilters: GameCreateEntityDNAFilters;
}

class GameCreateEntityUploadImageURLs {
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
  connections: GameCreateEntityConnections;

  @ApiProperty()
  uploadImageURLs: GameCreateEntityUploadImageURLs;
}
