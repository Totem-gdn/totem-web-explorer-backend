import { Prop } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

export class BaseAssetLike {
  @Prop({ type: SchemaTypes.String, required: true })
  tokenId: string;

  @Prop({ type: SchemaTypes.String, required: true })
  likedBy: string;
}
