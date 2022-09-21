import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({
  autoCreate: true,
  collection: 'legacyRecords',
  id: true,
  timestamps: { createdAt: true, updatedAt: false },
})
export class LegacyRecord {
  @Prop({ type: SchemaTypes.String, required: true, index: true })
  user: string;

  @Prop({ type: SchemaTypes.ObjectId, default: () => '' })
  assetId: string;

  @Prop({ type: SchemaTypes.ObjectId, default: () => '' })
  gameId: string;

  @Prop({ type: SchemaTypes.String, required: true })
  type: string;

  @Prop({ type: SchemaTypes.Mixed })
  data: any;
}

export type LegacyRecordDocument = LegacyRecord & Document & { createdAt: string };

export const LegacyRecordSchema = SchemaFactory.createForClass(LegacyRecord);
