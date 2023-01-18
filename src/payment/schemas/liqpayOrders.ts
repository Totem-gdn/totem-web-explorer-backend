import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { DocumentTimestamps } from '../../assets/types/document';

@Schema({
  autoCreate: true,
  collection: 'liqpayOrders',
  id: true,
  timestamps: { createdAt: true, updatedAt: true },
})
export class LiqpayOrder {
  @Prop({ type: SchemaTypes.String, required: true, index: true })
  owner: string;

  @Prop({ type: SchemaTypes.String, required: true })
  assetType: string;

  @Prop({ type: SchemaTypes.String, required: true })
  status: string;

  @Prop({ type: SchemaTypes.String, required: true })
  price: string;
}

export type LiqpayOrderDocument = LiqpayOrder & Document & DocumentTimestamps;

export const LiqpayOrderSchema = SchemaFactory.createForClass(LiqpayOrder);
