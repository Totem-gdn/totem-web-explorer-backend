import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Document } from 'mongoose';

@Schema({
  autoCreate: true,
  collection: 'properties',
  id: true,
  timestamps: { createdAt: true, updatedAt: false },
})
export class Properties {
  @Prop({ type: SchemaTypes.String, required: true })
  key: string;

  @Prop({ type: SchemaTypes.String, required: true })
  value: string;
}

export type PropertyDocument = Properties & Document & { isRead: boolean; createdAt: string };

export const PropertiesSchema = SchemaFactory.createForClass(Properties);
