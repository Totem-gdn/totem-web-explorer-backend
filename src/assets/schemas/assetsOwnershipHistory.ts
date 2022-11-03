import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema({
  autoCreate: true,
  collection: 'assetsOwnershipHistory',
  id: true,
  timestamps: { createdAt: true, updatedAt: false },
})
export class AssetsOwnershipHistory {
  @Prop({ type: SchemaTypes.String, required: true })
  tokenId: string;

  @Prop({ type: SchemaTypes.String, required: true })
  tokenType: string;

  @Prop({ type: SchemaTypes.String, required: true })
  from: string;

  @Prop({ type: SchemaTypes.String, required: true })
  to: string;

  @Prop({ type: SchemaTypes.String, required: true })
  hash: string;

  @Prop({ type: SchemaTypes.String })
  price: string;
}

export type AssetsOwnershipHistoryDocument = AssetsOwnershipHistory & Document & { createdAt: string };

export const AssetsOwnershipHistorySchema = SchemaFactory.createForClass(AssetsOwnershipHistory);
