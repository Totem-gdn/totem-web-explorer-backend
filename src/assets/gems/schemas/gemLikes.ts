import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseAssetLike } from '../../common/schemas/baseAssetLike';

@Schema({
  autoCreate: true,
  collection: 'gemLikes',
  id: true,
  timestamps: { createdAt: true, updatedAt: false },
})
export class GemLike extends BaseAssetLike {}

export type GemLikeDocument = GemLike & Document & { createdAt: string };

export const GemLikeSchema = SchemaFactory.createForClass(GemLike);
