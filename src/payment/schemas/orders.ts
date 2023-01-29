import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { DocumentTimestamps } from '../../assets/types/document';

@Schema({
  autoCreate: true,
  collection: 'orders',
  id: true,
  timestamps: { createdAt: true, updatedAt: true },
})
export class Order {
  @Prop({ type: SchemaTypes.String, required: true, index: true })
  owner: string;

  @Prop({ type: SchemaTypes.String, required: true })
  assetType: string;

  @Prop({ type: SchemaTypes.String, required: true })
  status: string;

  @Prop({ type: SchemaTypes.String, required: true })
  price: string;

  @Prop({ type: SchemaTypes.String })
  txHash: string;
}

export type OrderDocument = Order & Document & DocumentTimestamps;

export const OrderSchema = SchemaFactory.createForClass(Order);
