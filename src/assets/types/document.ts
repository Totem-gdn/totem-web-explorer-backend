import { AvatarAggregationDocument } from '../schemas/avatars';
import { ItemAggregationDocument } from '../schemas/items';
import { GemAggregationDocument } from '../schemas/gems';

export type DocumentTimestamps = { createdAt: string; updatedAt: string };

export type AssetAggregationDocument = AvatarAggregationDocument | ItemAggregationDocument | GemAggregationDocument;
