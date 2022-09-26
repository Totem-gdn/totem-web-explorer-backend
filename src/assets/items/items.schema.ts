import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({
  autoCreate: true,
  collection: 'items',
  id: true,
  timestamps: true,
})
export class Item {
  @Prop({ type: SchemaTypes.String, required: true, index: true })
  owner: string;

  @Prop({ type: [SchemaTypes.String], required: true, default: () => [] })
  owners: string[];

  @Prop({ type: SchemaTypes.String, required: true, index: true })
  tokenId: string;

  @Prop({ type: SchemaTypes.Number, required: true, default: () => 0 })
  views: number;
}

export type ItemDocument = Item & Document & { createdAt: string; updatedAt: string };

export type ItemAggregationDocument = ItemDocument & {
  isLiked: boolean;
  likes: number;
  games: number;
  lastUsed: string[];
};

export const ItemSchema = SchemaFactory.createForClass(Item);
