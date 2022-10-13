import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AssetEvent, AssetPayload, AssetQueue } from '../../config/queues/assets';
import { BaseAssetRecord } from '../common/interfaces/baseAssetRecord';
import { ListItemsFilter } from './interfaces/filters';
import { Item, ItemAggregationDocument, ItemDocument } from './schemas/items';
import { ItemLike, ItemLikeDocument } from './schemas/itemLikes';
import { LegacyService } from '../../legacy/legacy.service';
import { LegacyTypes } from '../../legacy/legacy.constants';
import { isMongoId } from 'class-validator';

@Injectable()
@Processor(AssetQueue.Items)
export class ItemsService {
  private readonly perPage: number = 10;

  constructor(
    private readonly config: ConfigService,
    private readonly legacyService: LegacyService,
    @InjectQueue(AssetQueue.Items) private readonly queue: Queue<AssetPayload>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(ItemLike.name) private readonly itemLikeModel: Model<ItemLikeDocument>,
  ) {}

  async findOne(id: string, user = ''): Promise<BaseAssetRecord> {
    const matchParams: Record<string, any> = {};
    if (isMongoId(id)) {
      matchParams._id = new Types.ObjectId(id);
    } else {
      matchParams.tokenId = id;
    }
    await this.itemModel.findOneAndUpdate({ ...matchParams }, { $inc: { views: 1 } }).exec();
    const [item] = await this.itemModel.aggregate<ItemAggregationDocument>([
      { $match: { ...matchParams } },
      this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyTypes.ItemLiked, user } }]),
      this.legacyLookupPipeline('likes', [{ $match: { type: LegacyTypes.ItemLiked } }]),
      this.legacyLookupPipeline('games', [{ $match: { type: LegacyTypes.ItemUsed } }]),
      this.legacyLookupPipeline('lastUsed', [
        { $match: { type: LegacyTypes.ItemUsed } },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
      ]),
      {
        $addFields: {
          isLiked: { $gt: [{ $size: '$isLiked' }, 0] },
          likes: { $size: '$likes' },
          games: { $size: '$games' },
          lastUsed: '$lastUsed.createdAt',
        },
      },
    ]);
    if (!item) {
      return null;
    }
    return this.toItemRecord(item);
  }

  async find(filters: ListItemsFilter): Promise<BaseAssetRecord[]> {
    const matchParams: Record<string, any> = {};
    if (filters.gameId) {
      matchParams.gameId = filters.gameId;
    }
    if (filters.list === 'my') {
      matchParams.owner = filters.user;
    }
    const sortParams: Record<string, any> = {};
    if (filters.list === 'popular') {
      sortParams.views = -1;
    } else {
      sortParams.createdAt = -1;
    }
    return this.aggregateItems(matchParams, sortParams, filters.page, filters.user);
  }

  private async aggregateItems(
    matchParams: Record<string, any>,
    sortParams: Record<string, any>,
    page: number,
    user = '',
  ): Promise<BaseAssetRecord[]> {
    const items: BaseAssetRecord[] = [];
    const aggregation = this.itemModel.aggregate<ItemAggregationDocument>([
      { $match: { ...matchParams } },
      { $sort: { ...sortParams } },
      { $skip: (page - 1) * this.perPage },
      { $limit: this.perPage },
      this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyTypes.ItemLiked, user } }]),
      this.legacyLookupPipeline('likes', [{ $match: { type: LegacyTypes.ItemLiked } }]),
      this.legacyLookupPipeline('games', [{ $match: { type: LegacyTypes.ItemUsed } }]),
      this.legacyLookupPipeline('lastUsed', [
        { $match: { type: LegacyTypes.ItemUsed } },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
      ]),
      {
        $addFields: {
          isLiked: { $gt: [{ $size: '$isLiked' }, 0] },
          likes: { $size: '$likes' },
          games: { $size: '$games' },
          lastUsed: '$lastUsed.createdAt',
        },
      },
    ]);
    for (const item of await aggregation.exec()) {
      items.push(await this.toItemRecord(item));
    }
    return items;
  }

  private legacyLookupPipeline(as: string, pipeline: any[]) {
    return {
      $lookup: {
        from: 'legacyRecords',
        localField: '_id',
        foreignField: 'assetId',
        pipeline,
        as,
      },
    };
  }

  private toItemRecord(item: ItemAggregationDocument): BaseAssetRecord {
    return {
      id: item._id.toString(),
      owner: item.owner,
      owners: item.owners,
      tokenId: item.tokenId,
      views: item.views,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isLiked: item.isLiked,
      likes: item.likes,
      games: item.games,
      lastUsed: item.lastUsed[0] || '',
    };
  }

  @Process(AssetEvent.Create)
  private async createItem(job: Job<AssetPayload>) {
    await this.itemModel.create({
      tokenId: job.data.tokenId,
      owner: job.data.to,
      owners: [job.data.to],
      views: 0,
    });
  }

  @Process(AssetEvent.Transfer)
  private async transferItem(job: Job<AssetPayload>) {
    await this.itemModel.findOneAndUpdate(
      { tokenId: job.data.tokenId },
      {
        $set: { owner: job.data.to },
        $push: { owners: job.data.from },
      },
    );
  }
}
