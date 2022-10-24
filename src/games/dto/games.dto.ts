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

export class GameGeneralInformation {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  fullDescription = '';

  @IsArray()
  @ArrayNotEmpty()
  genre: string[];
}

export class GameDetails {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsArray()
  @ArrayNotEmpty()
  platforms: string[];

  @IsOptional()
  @IsString()
  madeWith: string;

  @IsOptional()
  @IsString()
  session: string;

  @IsOptional()
  @IsString()
  languages: string;

  @IsOptional()
  @IsString()
  inputs: string;
}

export class GameImage {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @Matches(/(^image)(\/)([a-zA-Z0-9_.\-+]+)/)
  mimeType: string;

  @IsNumber()
  @IsPositive()
  contentLength: number;
}

export class DNAFilter {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsMimeType()
  mimeType: string;

  @IsNumber()
  @IsPositive()
  contentLength: number;
}

export class GameImages {
  @ValidateNested()
  @Type(() => GameImage)
  coverImage: GameImage;

  @ValidateNested()
  @Type(() => GameImage)
  cardThumbnail: GameImage;

  @ValidateNested()
  @Type(() => GameImage)
  smallThumbnail: GameImage;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GameImage)
  gallery: GameImage[];
}

export class SocialLink {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsUrl()
  url: string;
}

export class GameConnections {
  @IsUrl()
  webpage: string;

  @IsOptional()
  @IsUrl()
  assetRenderer: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DNAFilter)
  dnaFilter: DNAFilter;

  @IsOptional()
  @IsUrl()
  promoVideo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLink)
  socialLinks: SocialLink[];
}

export class GameContacts {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  discord: string;
}

export class CreateGameRequestDto {
  owner: string;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => GameGeneralInformation)
  general: GameGeneralInformation;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => GameDetails)
  details: GameDetails;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => GameImages)
  images: GameImages;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => GameConnections)
  connections: GameConnections;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => GameContacts)
  contacts: GameContacts;
}
