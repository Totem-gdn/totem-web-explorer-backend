import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Document } from 'mongoose';

@Schema({
  autoCreate: true,
  collection: 'messagesLegacy',
  id: true,
  timestamps: { createdAt: true, updatedAt: false },
})
export class MessagesLegacy {
  @Prop({ type: SchemaTypes.String, required: true })
  type: string;

  @Prop({ type: SchemaTypes.String, required: true })
  user: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  message: string;
}

export type MessagesLegacyDocument = MessagesLegacy & Document & { createdAt: string };

export const MessagesLegacySchema = SchemaFactory.createForClass(MessagesLegacy);
