import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseAssetLike } from '../common/schemas/baseAssetLike';

@Schema({
  autoCreate: true,
  collection: 'itemLikes',
  id: true,
  timestamps: { createdAt: true, updatedAt: false },
})
export class ItemLike extends BaseAssetLike {}

export type ItemLikeDocument = ItemLike & Document & { createdAt: string };

export const ItemLikeSchema = SchemaFactory.createForClass(ItemLike);
