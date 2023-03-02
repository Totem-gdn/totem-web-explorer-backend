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
import { IsValidAddress } from '../../utils/IsValidAddress';

export class UpdateGameRequestGeneral {
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

export class UpdateGameRequestDetails {
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

export class UpdateGameRequestImage {
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

export class UpdateGameRequestDNAFilter {
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

export class UpdateGameRequestImages {
  @ValidateNested()
  @Type(() => UpdateGameRequestImage)
  @ApiProperty()
  coverImage: UpdateGameRequestImage;

  @ValidateNested()
  @Type(() => UpdateGameRequestImage)
  @ApiProperty()
  cardThumbnail: UpdateGameRequestImage;

  @ValidateNested()
  @Type(() => UpdateGameRequestImage)
  @ApiProperty()
  smallThumbnail: UpdateGameRequestImage;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateGameRequestImage)
  @ApiProperty()
  gallery: UpdateGameRequestImage[];
}

export class UpdateGameRequestDNAFilters {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGameRequestDNAFilter)
  @ApiProperty()
  avatarFilter?: UpdateGameRequestDNAFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGameRequestDNAFilter)
  @ApiProperty()
  assetFilter?: UpdateGameRequestDNAFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGameRequestDNAFilter)
  @ApiProperty()
  gemFilter?: UpdateGameRequestDNAFilter;
}

export class UpdateGameRequestSocialLink {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  type: string;

  @IsUrl()
  @ApiProperty()
  url: string;
}

export class UpdateGameRequestConnections {
  @IsUrl()
  @ApiProperty()
  webpage: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty()
  assetRenderer: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGameRequestDNAFilters)
  @ApiProperty()
  dnaFilters: UpdateGameRequestDNAFilters;

  @IsOptional()
  @IsUrl()
  @ApiProperty()
  promoVideo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGameRequestSocialLink)
  @ApiProperty()
  socialLinks: UpdateGameRequestSocialLink[];
}

export class UpdateGameRequestContacts {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  discord: string;
}

export class UpdateGameRequestDTO {
  owner: string;

  @IsOptional()
  @ValidateNested()
  @ApiProperty()
  @Type(() => UpdateGameRequestGeneral)
  general: UpdateGameRequestGeneral;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGameRequestDetails)
  @ApiProperty()
  details: UpdateGameRequestDetails;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGameRequestImages)
  @ApiProperty()
  images: UpdateGameRequestImages;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGameRequestConnections)
  @ApiProperty()
  connections: UpdateGameRequestConnections;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGameRequestContacts)
  @ApiProperty()
  contacts: UpdateGameRequestContacts;

  @IsOptional()
  @ApiProperty({
    example: [
      'https://static-dev.totem-explorer.com/6364c51be261234ed44481df/afe5f0d9-e4b1-4187-88f0-6e8c66992692-SS_02.png',
    ],
  })
  galleryImagesForDelete?: string[];

  @IsOptional()
  @Type(() => Array<UpdateGameRequestImage>)
  @ApiProperty({
    example: [
      'https://static-dev.totem-explorer.com/6364c51be261234ed44481df/afe5f0d9-e4b1-4187-88f0-6e8c66992692-SS_02.png',
    ],
  })
  galleryImagesForUpload?: UpdateGameRequestImage[];
}
