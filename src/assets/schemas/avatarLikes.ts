import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseAssetLike } from '../common/schemas/baseAssetLike';

@Schema({
  autoCreate: true,
  collection: 'avatarLikes',
  id: true,
  timestamps: { createdAt: true, updatedAt: false },
})
export class AvatarLike extends BaseAssetLike {}

export type AvatarLikeDocument = AvatarLike & Document & { createdAt: string };

export const AvatarLikeSchema = SchemaFactory.createForClass(AvatarLike);
