import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ _id: false })
class GeneralInformation {
  @Prop({ type: SchemaTypes.String, required: true, unique: true, index: true })
  name: string;

  @Prop({ type: SchemaTypes.String, required: true, index: true })
  author: string;

  @Prop({ type: SchemaTypes.String })
  description: string;

  @Prop({ type: SchemaTypes.String })
  fullDescription: string;

  @Prop({ type: [SchemaTypes.String] })
  genre: string[];
}

const GeneralInformationSchema = SchemaFactory.createForClass(GeneralInformation);

@Schema({ _id: false })
class GameDetails {
  @Prop({ type: SchemaTypes.String })
  status: string;

  @Prop({ type: SchemaTypes.String })
  platforms: string;

  @Prop({ type: SchemaTypes.String })
  madeWith: string;

  @Prop({ type: SchemaTypes.String })
  averageSession: string;

  @Prop({ type: SchemaTypes.String })
  languages: string;

  @Prop({ type: SchemaTypes.String })
  inputs: string;
}

const GameDetailsSchema = SchemaFactory.createForClass(GameDetails);

@Schema({ _id: false })
class GameImage {
  @Prop({ type: SchemaTypes.String })
  filename: string;

  @Prop({ type: SchemaTypes.String })
  mimeType: string;

  @Prop({ type: SchemaTypes.Number })
  contentLength: number;
}

const GameImageSchema = SchemaFactory.createForClass(GameImage);

@Schema({ _id: false })
class GameImages {
  @Prop({ type: GameImageSchema })
  coverImage: GameImage;

  @Prop({ type: GameImageSchema })
  cardThumbnail: GameImage;

  @Prop({ type: GameImageSchema })
  smallThumbnail: GameImage;

  @Prop({ type: [GameImageSchema] })
  imagesGallery: GameImage[];
}

const GameImagesSchema = SchemaFactory.createForClass(GameImages);

@Schema({ _id: false })
class Integration {
  @Prop({ type: SchemaTypes.String })
  type: string;

  @Prop({ type: SchemaTypes.String })
  url: string;
}

const IntegrationSchema = SchemaFactory.createForClass(Integration);

@Schema({ _id: false })
class GameSocialMedia {
  @Prop({ type: SchemaTypes.String })
  promoVideo: string;

  @Prop({ type: [IntegrationSchema] })
  integrations: Integration[];
}

const GameSocialMediaSchema = SchemaFactory.createForClass(GameSocialMedia);

@Schema({ _id: false })
class GameContacts {
  @Prop({ type: SchemaTypes.String })
  email: string;

  @Prop({ type: SchemaTypes.String })
  discord: string;
}

const GameContactsSchema = SchemaFactory.createForClass(GameContacts);

export type GameDocument = Game & Document & { createdAt: string; updatedAt: string };

@Schema({
  autoCreate: true,
  collection: 'games',
  id: true,
  timestamps: true,
})
export class Game {
  @Prop({ type: SchemaTypes.String, required: true, index: true })
  ownerAddress: string;

  @Prop({ type: SchemaTypes.Boolean, required: true, default: () => false })
  visible: boolean;

  @Prop({ type: GeneralInformationSchema })
  general: GeneralInformation;

  @Prop({ type: GameDetailsSchema })
  details: GameDetails;

  @Prop({ type: GameImagesSchema })
  images: GameImages;

  @Prop({ type: GameSocialMediaSchema })
  socialMedia: GameSocialMedia;

  @Prop({ type: GameContactsSchema })
  contacts: GameContacts;
}

export const GameSchema = SchemaFactory.createForClass(Game);
