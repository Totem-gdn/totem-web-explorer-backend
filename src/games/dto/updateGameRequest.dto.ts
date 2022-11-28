import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsMimeType,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GameGeneralInformation {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  author: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  @ApiProperty()
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  @ApiProperty()
  fullDescription = '';

  @IsArray()
  @ArrayNotEmpty()
  @ApiProperty()
  genre: string[];
}

export class GameDetails {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  status: string;

  @IsArray()
  @ArrayNotEmpty()
  @ApiProperty()
  platforms: string[];

  @IsOptional()
  @IsString()
  @ApiProperty()
  madeWith: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  session: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  languages: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  inputs: string;
}

export class GameImage {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  filename: string;

  @Matches(/(^image)(\/)([a-zA-Z0-9_.\-+]+)/)
  @ApiProperty()
  mimeType: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty()
  contentLength: number;
}

export class DNAFilter {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  filename: string;

  @IsMimeType()
  @ApiProperty()
  mimeType: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty()
  contentLength: number;
}

export class GameImages {
  @ValidateNested()
  @Type(() => GameImage)
  @ApiProperty()
  coverImage: GameImage;

  @ValidateNested()
  @Type(() => GameImage)
  @ApiProperty()
  cardThumbnail: GameImage;

  @ValidateNested()
  @Type(() => GameImage)
  @ApiProperty()
  smallThumbnail: GameImage;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GameImage)
  @ApiProperty()
  gallery: GameImage[];
}

export class DNAFilters {
  @IsOptional()
  @ValidateNested()
  @Type(() => DNAFilter)
  @ApiProperty()
  avatarFilter?: DNAFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => DNAFilter)
  @ApiProperty()
  assetFilter?: DNAFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => DNAFilter)
  @ApiProperty()
  gemFilter?: DNAFilter;
}

export class SocialLink {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  type: string;

  @IsUrl()
  @ApiProperty()
  url: string;
}

export class GameConnections {
  @IsUrl()
  @ApiProperty()
  webpage: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty()
  assetRenderer: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DNAFilters)
  @ApiProperty()
  dnaFilters: DNAFilters;

  @IsOptional()
  @IsUrl()
  @ApiProperty()
  promoVideo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLink)
  @ApiProperty()
  socialLinks: SocialLink[];
}

export class GameContacts {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  discord: string;
}

export class UpdateGameRequestDto {
  owner: string;

  @IsOptional()
  @ValidateNested()
  @ApiProperty()
  @Type(() => GameGeneralInformation)
  general: GameGeneralInformation;

  @IsOptional()
  @ValidateNested()
  @Type(() => GameDetails)
  @ApiProperty()
  details: GameDetails;

  @IsOptional()
  @ValidateNested()
  @Type(() => GameImages)
  @ApiProperty()
  images: GameImages;

  @IsOptional()
  @ValidateNested()
  @Type(() => GameConnections)
  @ApiProperty()
  connections: GameConnections;

  @IsOptional()
  @ValidateNested()
  @Type(() => GameContacts)
  @ApiProperty()
  contacts: GameContacts;

  @IsOptional()
  @ApiProperty({
    example: [
      'https://static-dev.totem-explorer.com/6364c51be261234ed44481df/afe5f0d9-e4b1-4187-88f0-6e8c66992692-SS_02.png',
    ],
  })
  galleryImagesForDelete?: string[];

  @IsOptional()
  @Type(() => Array<GameImage>)
  @ApiProperty({
    example: [
      'https://static-dev.totem-explorer.com/6364c51be261234ed44481df/afe5f0d9-e4b1-4187-88f0-6e8c66992692-SS_02.png',
    ],
  })
  galleryImagesForUpload?: GameImage[];
}
