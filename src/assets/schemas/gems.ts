import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseAsset } from '../common/schemas/baseAsset';
import { DocumentTimestamps } from '../types/document';

@Schema({
  autoCreate: true,
  collection: 'gems',
  id: true,
  timestamps: true,
})
export class Gem extends BaseAsset {}

export type GemDocument = Gem & Document & DocumentTimestamps;

export type GemAggregationDocument = GemDocument & {
  isLiked: boolean;
  likes: number;
  games: number;
  lastUsed: string[];
};

export const GemSchema = SchemaFactory.createForClass(Gem);
