import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ _id: false })
class GeneralInformation {
  @Prop({ type: SchemaTypes.String, required: true, unique: true, index: true })
  name: string;

  @Prop({ type: SchemaTypes.String, required: true, index: true })
  author: string;

  @Prop({ type: SchemaTypes.String, default: () => '' })
  description: string;

  @Prop({ type: SchemaTypes.String, default: () => '' })
  fullDescription: string;

  @Prop({ type: [SchemaTypes.String], default: () => [] })
  genre: string[];
}

const GeneralInformationSchema = SchemaFactory.createForClass(GeneralInformation);

@Schema({ _id: false })
class GameDetails {
  @Prop({ type: SchemaTypes.String, required: true })
  status: string;

  @Prop({ type: [SchemaTypes.String], required: true })
  platforms: string[];

  @Prop({ type: SchemaTypes.String, default: () => '' })
  madeWith: string;

  @Prop({ type: SchemaTypes.String, default: () => '' })
  session: string;

  @Prop({ type: SchemaTypes.String, default: () => '' })
  languages: string;

  @Prop({ type: SchemaTypes.String, default: () => '' })
  inputs: string;
}

const GameDetailsSchema = SchemaFactory.createForClass(GameDetails);

@Schema({ _id: false })
class GameImage {
  @Prop({ type: SchemaTypes.String, required: true })
  filename: string;

  @Prop({ type: SchemaTypes.String, required: true })
  mimeType: string;

  @Prop({ type: SchemaTypes.Number, required: true })
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
  gallery: GameImage[];
}

const GameImagesSchema = SchemaFactory.createForClass(GameImages);

@Schema({ _id: false })
class SocialLink {
  @Prop({ type: SchemaTypes.String, required: true })
  type: string;

  @Prop({ type: SchemaTypes.String, required: true })
  url: string;
}

const SocialLinkSchema = SchemaFactory.createForClass(SocialLink);

@Schema({ _id: false })
class GameConnections {
  @Prop({ type: SchemaTypes.String, required: true })
  webpage: string;

  @Prop({ type: SchemaTypes.String, default: () => '' })
  assetRenderer: string;

  @Prop({ type: SchemaTypes.String, default: () => '' })
  promoVideo: string;

  @Prop({ type: [SocialLinkSchema], default: () => [] })
  socialLinks: SocialLink[];
}

const GameConnectionsSchema = SchemaFactory.createForClass(GameConnections);

@Schema({ _id: false })
class GameContacts {
  @Prop({ type: SchemaTypes.String, required: true })
  email: string;

  @Prop({ type: SchemaTypes.String, default: () => '' })
  discord: string;
}

const GameContactsSchema = SchemaFactory.createForClass(GameContacts);

@Schema({
  autoCreate: true,
  collection: 'games',
  id: true,
  timestamps: true,
})
export class Game {
  @Prop({ type: SchemaTypes.String, required: true, index: true })
  owner: string;

  @Prop({ type: SchemaTypes.Boolean, required: true, default: () => false })
  approved: boolean;

  @Prop({ type: SchemaTypes.Number, required: true, default: () => 0 })
  views: number;

  @Prop({ type: GeneralInformationSchema })
  general: GeneralInformation;

  @Prop({ type: GameDetailsSchema })
  details: GameDetails;

  @Prop({ type: GameImagesSchema })
  images: GameImages;

  @Prop({ type: GameConnectionsSchema })
  connections: GameConnections;

  @Prop({ type: GameContactsSchema })
  contacts: GameContacts;
}

export type GameDocument = Game & Document & { createdAt: string; updatedAt: string };

export type GameAggregationDocument = GameDocument & {
  isLiked: boolean;
  players: number;
  likes: number;
  assets: { avatars: number; items: number };
};

export const GamesSchema = SchemaFactory.createForClass(Game);
