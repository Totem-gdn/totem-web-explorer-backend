import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema({
  autoCreate: true,
  collection: 'profiles',
  id: true,
  timestamps: { createdAt: true, updatedAt: false },
})
export class UserProfile {
  @Prop({ type: SchemaTypes.String, required: true, unique: true, index: true })
  publicKey: string;

  @Prop({ type: SchemaTypes.Number, required: true })
  welcomeTokens: number;
}

export type UserProfileDocument = UserProfile & Document & { createdAt: string };

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
