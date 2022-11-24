import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Document } from 'mongoose';

@Schema({
  autoCreate: true,
  collection: 'pagesBlocks',
  id: true,
  timestamps: { createdAt: true, updatedAt: false },
})
export class PageBlocks {
  @Prop({ type: SchemaTypes.String, required: true, unique: true, index: true })
  title: string;

  @Prop({ type: SchemaTypes.String, required: true })
  type: string;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  data: object;
}

export type PageBlocksDocument = PageBlocks & Document & { createdAt: string };

export const PageBlocksSchema = SchemaFactory.createForClass(PageBlocks);
