import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
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

  @IsString()
  @MaxLength(3000)
  fullDescription: string;

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

  @IsString()
  madeWith: string;

  @IsString()
  session: string;

  @IsString()
  languages: string;

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

  @IsUrl()
  assetRenderer: string;

  @IsUrl()
  promoVideo: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SocialLink)
  socialLinks: SocialLink[];
}

export class GameContacts {
  @IsEmail()
  email: string;

  @IsString()
  discord: string;
}

export class CreateGameRequestDto {
  owner: string;

  @ValidateNested()
  @Type(() => GameGeneralInformation)
  general: GameGeneralInformation;

  @ValidateNested()
  @Type(() => GameDetails)
  details: GameDetails;

  @ValidateNested()
  @Type(() => GameImages)
  images: GameImages;

  @ValidateNested()
  @Type(() => GameConnections)
  connections: GameConnections;

  @ValidateNested()
  @Type(() => GameContacts)
  contacts: GameContacts;
}
