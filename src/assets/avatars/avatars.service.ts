import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AssetEvent, AssetPayload, AssetQueue } from '../../config/queues/assets';
import { BaseAssetRecord } from '../common/interfaces/baseAssetRecord';
import { ListAvatarsFilters } from './interfaces/filters';
import { Avatar, AvatarAggregationDocument, AvatarDocument } from './schemas/avatars';
import { LegacyService } from '../../legacy/legacy.service';
import { LegacyTypes } from '../../legacy/legacy.constants';
import { AvatarLike, AvatarLikeDocument } from './schemas/avatarLikes';
import { isMongoId } from 'class-validator';

@Injectable()
@Processor(AssetQueue.Avatars)
export class AvatarsService {
  private readonly perPage: number = 10;

  constructor(
    private readonly config: ConfigService,
    private readonly legacyService: LegacyService,
    @InjectQueue(AssetQueue.Avatars) private readonly queue: Queue<AssetPayload>,
    @InjectModel(Avatar.name) private readonly avatarModel: Model<AvatarDocument>,
    @InjectModel(AvatarLike.name) private readonly avatarLikeModel: Model<AvatarLikeDocument>,
  ) {}

  async findOne(id: string, user = ''): Promise<BaseAssetRecord> {
    const matchParams: Record<string, any> = {};
    if (isMongoId(id)) {
      matchParams._id = new Types.ObjectId(id);
    } else {
      matchParams.tokenId = id;
    }
    await this.avatarModel.findOneAndUpdate({ ...matchParams }, { $inc: { views: 1 } }).exec();
    const [avatar] = await this.avatarModel.aggregate<AvatarAggregationDocument>([
      { $match: { ...matchParams } },
      this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyTypes.AvatarLiked, user } }]),
      this.legacyLookupPipeline('likes', [{ $match: { type: LegacyTypes.AvatarLiked } }]),
      this.legacyLookupPipeline('games', [{ $match: { type: LegacyTypes.AvatarUsed } }]),
      this.legacyLookupPipeline('lastUsed', [
        { $match: { type: LegacyTypes.AvatarUsed } },
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
    if (!avatar) {
      return null;
    }
    return this.toAvatarRecord(avatar);
  }

  async find(filters: ListAvatarsFilters): Promise<BaseAssetRecord[]> {
    const matchParams: Record<string, any> = {};
    if (filters.search) {
      matchParams.tokenId = { $in: [new RegExp(filters.search, 'gi')] };
    }
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
    return this.aggregateAvatars(matchParams, sortParams, filters.page, filters.user);
  }

  private async aggregateAvatars(
    matchParams: Record<string, any>,
    sortParams: Record<string, any>,
    page: number,
    user = '',
  ): Promise<BaseAssetRecord[]> {
    const avatars: BaseAssetRecord[] = [];
    const aggregation = this.avatarModel.aggregate<AvatarAggregationDocument>([
      { $match: { ...matchParams } },
      { $sort: { ...sortParams } },
      { $skip: (page - 1) * this.perPage },
      { $limit: this.perPage },
      this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyTypes.AvatarLiked, user } }]),
      this.legacyLookupPipeline('likes', [{ $match: { type: LegacyTypes.AvatarLiked } }]),
      this.legacyLookupPipeline('games', [{ $match: { type: LegacyTypes.AvatarUsed } }]),
      this.legacyLookupPipeline('lastUsed', [
        { $match: { type: LegacyTypes.AvatarUsed } },
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
    for (const avatar of await aggregation.exec()) {
      avatars.push(await this.toAvatarRecord(avatar));
    }
    return avatars;
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

  private toAvatarRecord(avatar: AvatarAggregationDocument): BaseAssetRecord {
    return {
      id: avatar._id.toString(),
      owner: avatar.owner,
      owners: avatar.owners,
      tokenId: avatar.tokenId,
      views: avatar.views,
      createdAt: avatar.createdAt,
      updatedAt: avatar.updatedAt,
      isLiked: avatar.isLiked,
      likes: avatar.likes,
      games: avatar.games,
      lastUsed: avatar.lastUsed[0] || '',
    };
  }

  @Process(AssetEvent.Create)
  private async createAvatar(job: Job<AssetPayload>) {
    await this.avatarModel.create({
      tokenId: job.data.tokenId,
      owner: job.data.to,
      owners: [job.data.to],
      views: 0,
    });
  }

  @Process(AssetEvent.Transfer)
  private async transferAvatar(job: Job<AssetPayload>) {
    await this.avatarModel.findOneAndUpdate(
      { tokenId: job.data.tokenId },
      {
        $set: { owner: job.data.to },
        $push: { owners: job.data.from },
      },
    );
  }
}
