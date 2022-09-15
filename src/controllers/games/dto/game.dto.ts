import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsMimeType,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class GameInformation {
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
  @IsNotEmpty()
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

  @IsString()
  @IsNotEmpty()
  platforms: string;

  @IsString()
  @IsNotEmpty()
  madeWith: string;

  @IsString()
  @IsNotEmpty()
  averageSession: string;

  @IsString()
  @IsNotEmpty()
  languages: string;

  @IsString()
  @IsNotEmpty()
  inputs: string;
}

export class GameImage {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsMimeType()
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
  @ValidateNested()
  @Type(() => GameImage)
  imagesGallery: GameImage[];
}

export class Integration {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  @IsUrl()
  url: string;
}

export class GameSocialMedia {
  @IsNotEmpty()
  @IsUrl()
  promoVideo: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Integration)
  integrations: Integration[];
}

export class GameContacts {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  discord: string;
}

export class GameDto {
  @IsString()
  @IsNotEmpty()
  ownerAddress: string;

  @ValidateNested()
  @Type(() => GameInformation)
  general: GameInformation;

  @ValidateNested()
  @Type(() => GameDetails)
  details: GameDetails;

  @ValidateNested()
  @Type(() => GameImages)
  images: GameImages;

  @ValidateNested()
  @Type(() => GameSocialMedia)
  socialMedia: GameSocialMedia;

  @ValidateNested()
  @Type(() => GameContacts)
  contacts: GameContacts;
}

export class CreateGameRequestDto {
  @IsString()
  @IsNotEmpty()
  ownerAddress: string;

  @ValidateNested()
  @Type(() => GameInformation)
  general: GameInformation;

  @ValidateNested()
  @Type(() => GameDetails)
  details: GameDetails;

  @ValidateNested()
  @Type(() => GameImages)
  images: GameImages;

  @ValidateNested()
  @Type(() => GameSocialMedia)
  socialMedia: GameSocialMedia;

  @ValidateNested()
  @Type(() => GameContacts)
  contacts: GameContacts;
}

export class CreateGameResponseDto {
  id: string;
  uploadImageURLs: {
    coverImage: string;
    cardThumbnail: string;
    smallThumbnail: string;
    imagesGallery: string[];
  };
}
