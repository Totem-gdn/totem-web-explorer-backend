import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Document } from 'mongoose';

@Schema({
  autoCreate: true,
  collection: 'messages',
  id: true,
  timestamps: { createdAt: true, updatedAt: false },
})
export class Messages {
  @Prop({ type: SchemaTypes.String, required: true })
  type: string;

  @Prop({ type: SchemaTypes.String, required: true })
  subject: string;

  @Prop({ type: SchemaTypes.String, required: true })
  date: string;

  @Prop({ type: SchemaTypes.String, required: true })
  message: string;
}

export type MessagesDocument = Messages & Document & { isRead: boolean; createdAt: string };

export const MessagesSchema = SchemaFactory.createForClass(Messages);
