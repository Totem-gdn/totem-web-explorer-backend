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

export class CreateGameRequestGeneral {
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

export class CreateGameRequestDetails {
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

export class CreateGameRequestImage {
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

export class CreateGameRequestDNAFilter {
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

export class CreateGameRequestImages {
  @ValidateNested()
  @Type(() => CreateGameRequestImage)
  @ApiProperty()
  coverImage: CreateGameRequestImage;

  @ValidateNested()
  @Type(() => CreateGameRequestImage)
  @ApiProperty()
  cardThumbnail: CreateGameRequestImage;

  @ValidateNested()
  @Type(() => CreateGameRequestImage)
  @ApiProperty()
  smallThumbnail: CreateGameRequestImage;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateGameRequestImage)
  @ApiProperty()
  gallery: CreateGameRequestImage[];
}

export class CreateGameRequestDNAFilters {
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateGameRequestDNAFilter)
  @ApiProperty()
  avatarFilter?: CreateGameRequestDNAFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateGameRequestDNAFilter)
  @ApiProperty()
  assetFilter?: CreateGameRequestDNAFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateGameRequestDNAFilter)
  @ApiProperty()
  gemFilter?: CreateGameRequestDNAFilter;
}

export class CreateGameRequestSocialLink {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  type: string;

  @IsUrl()
  @ApiProperty()
  url: string;
}

export class CreateGameRequestConnections {
  @IsUrl()
  @ApiProperty()
  webpage: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty()
  assetRenderer: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateGameRequestDNAFilters)
  @ApiProperty()
  dnaFilters: CreateGameRequestDNAFilters;

  @IsOptional()
  @IsUrl()
  @ApiProperty()
  promoVideo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGameRequestSocialLink)
  @ApiProperty()
  socialLinks: CreateGameRequestSocialLink[];
}

export class CreateGameRequestContacts {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  discord: string;
}

export class CreateGameRequestDTO {
  owner: string;

  @IsNotEmptyObject()
  @ValidateNested()
  @ApiProperty()
  @Type(() => CreateGameRequestGeneral)
  general: CreateGameRequestGeneral;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CreateGameRequestDetails)
  @ApiProperty()
  details: CreateGameRequestDetails;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CreateGameRequestImages)
  @ApiProperty()
  images: CreateGameRequestImages;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CreateGameRequestConnections)
  @ApiProperty()
  connections: CreateGameRequestConnections;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CreateGameRequestContacts)
  @ApiProperty()
  contacts: CreateGameRequestContacts;
}
