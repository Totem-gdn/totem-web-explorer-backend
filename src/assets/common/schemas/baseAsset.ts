import { Prop } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

export class BaseAsset {
  @Prop({ type: SchemaTypes.String, required: true, index: true, unique: true })
  tokenId: string;

  @Prop({ type: SchemaTypes.String, required: true, index: true })
  owner: string;

  @Prop({ type: [SchemaTypes.String], required: true, default: () => [] })
  owners: string[];

  @Prop({ type: SchemaTypes.Number, required: true, default: () => 0 })
  views: number;
}
