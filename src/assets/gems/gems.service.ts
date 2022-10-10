import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AssetEvent, AssetPayload, AssetQueue } from '../../config/queues/assets';
import { BaseAssetRecord } from '../common/interfaces/baseAssetRecord';
import { ListGemsFilters } from './interfaces/filters';
import { Gem, GemAggregationDocument, GemDocument } from './schemas/gems';
import { LegacyService } from '../../legacy/legacy.service';
import { LegacyTypes } from '../../legacy/legacy.constants';
import { GemLike, GemLikeDocument } from './schemas/gemLikes';

@Injectable()
@Processor(AssetQueue.Gems)
export class GemsService {
  private readonly logger = new Logger(GemsService.name);
  private readonly perPage: number = 10;

  constructor(
    private readonly config: ConfigService,
    private readonly legacyService: LegacyService,
    @InjectQueue(AssetQueue.Gems) private readonly queue: Queue<AssetPayload>,
    @InjectModel(Gem.name) private readonly gemModel: Model<GemDocument>,
    @InjectModel(GemLike.name) private readonly gemLikeModel: Model<GemLikeDocument>,
  ) {}

  async findOne(id: string, user = ''): Promise<BaseAssetRecord> {
    await this.gemModel.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
    const [gem] = await this.gemModel.aggregate<GemAggregationDocument>([
      { $match: { _id: new Types.ObjectId(id) } },
      this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyTypes.GemLiked, user } }]),
      this.legacyLookupPipeline('likes', [{ $match: { type: LegacyTypes.GemLiked } }]),
      this.legacyLookupPipeline('games', [{ $match: { type: LegacyTypes.GemLiked } }]),
      this.legacyLookupPipeline('lastUsed', [
        { $match: { type: LegacyTypes.GemUsed } },
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
    if (!gem) {
      return null;
    }
    return this.toGemRecord(gem);
  }

  async find(filters: ListGemsFilters): Promise<BaseAssetRecord[]> {
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
    return this.aggregateGems(matchParams, sortParams, filters.page, filters.user);
  }

  private async aggregateGems(
    matchParams: Record<string, any>,
    sortParams: Record<string, any>,
    page: number,
    user = '',
  ): Promise<BaseAssetRecord[]> {
    const gems: BaseAssetRecord[] = [];
    const aggregation = this.gemModel.aggregate<GemAggregationDocument>([
      { $match: { ...matchParams } },
      { $sort: { ...sortParams } },
      { $skip: (page - 1) * this.perPage },
      { $limit: this.perPage },
      this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyTypes.GemLiked, user } }]),
      this.legacyLookupPipeline('likes', [{ $match: { type: LegacyTypes.GemLiked } }]),
      this.legacyLookupPipeline('games', [{ $match: { type: LegacyTypes.GemLiked } }]),
      this.legacyLookupPipeline('lastUsed', [
        { $match: { type: LegacyTypes.GemUsed } },
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
    for (const gem of await aggregation.exec()) {
      gems.push(await this.toGemRecord(gem));
    }
    return gems;
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

  private toGemRecord(gem: GemAggregationDocument): BaseAssetRecord {
    return {
      id: gem._id.toString(),
      owner: gem.owner,
      owners: gem.owners,
      tokenId: gem.tokenId,
      views: gem.views,
      createdAt: gem.createdAt,
      updatedAt: gem.updatedAt,
      isLiked: gem.isLiked,
      likes: gem.likes,
      games: gem.games,
      lastUsed: gem.lastUsed[0] || '',
    };
  }

  @Process(AssetEvent.Create)
  private async createGem(job: Job<AssetPayload>) {
    await this.gemModel.create({
      tokenId: job.data.tokenId,
      owner: job.data.to,
      owners: [job.data.to],
      views: 0,
    });
  }

  @Process(AssetEvent.Transfer)
  private async transferGem(job: Job<AssetPayload>) {
    await this.gemModel.findOneAndUpdate(
      { tokenId: job.data.tokenId },
      {
        $set: { owner: job.data.to },
        $push: { owners: job.data.from },
      },
    );
  }
}
