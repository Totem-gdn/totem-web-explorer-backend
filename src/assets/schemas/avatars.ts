import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseAsset } from '../common/schemas/baseAsset';
import { DocumentTimestamps } from '../types/document';

@Schema({
  autoCreate: true,
  collection: 'avatars',
  id: true,
  timestamps: true,
})
export class Avatar extends BaseAsset {}

export type AvatarDocument = Avatar & Document & DocumentTimestamps;

export type AvatarAggregationDocument = AvatarDocument & {
  isLiked: boolean;
  likes: number;
  games: number;
  lastUsed: string[];
};

export const AvatarSchema = SchemaFactory.createForClass(Avatar);
