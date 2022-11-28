import { ApiProperty } from '@nestjs/swagger';

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
  dnaFilters: DnaFilters;
}

class UploadImageURLs {
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
  connections: Connections;

  @ApiProperty()
  uploadImageURLs: UploadImageURLs;
}
