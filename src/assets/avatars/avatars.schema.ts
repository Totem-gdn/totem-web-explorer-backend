import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({
  autoCreate: true,
  collection: 'avatars',
  id: true,
  timestamps: true,
})
export class Avatar {
  @Prop({ type: SchemaTypes.String, required: true, index: true })
  owner: string;

  @Prop({ type: [SchemaTypes.String], required: true, default: () => [] })
  owners: string[];

  @Prop({ type: SchemaTypes.String, required: true, index: true })
  tokenId: string;

  @Prop({ type: SchemaTypes.Number, required: true, default: () => 0 })
  views: number;
}

export type AvatarDocument = Avatar & Document & { createdAt: string; updatedAt: string };

export type AvatarAggregationDocument = AvatarDocument & {
  isLiked: boolean;
  likes: number;
  games: number;
  lastUsed: string[];
};

export const AvatarSchema = SchemaFactory.createForClass(Avatar);
