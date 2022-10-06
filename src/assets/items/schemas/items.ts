import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseAsset } from '../../common/schemas/baseAsset';
import { DocumentTimestamps } from '../../common/types/document';

@Schema({
  autoCreate: true,
  collection: 'items',
  id: true,
  timestamps: true,
})
export class Item extends BaseAsset {}

export type ItemDocument = Item & Document & DocumentTimestamps;

export type ItemAggregationDocument = ItemDocument & {
  isLiked: boolean;
  likes: number;
  games: number;
  lastUsed: string[];
};

export const ItemSchema = SchemaFactory.createForClass(Item);
