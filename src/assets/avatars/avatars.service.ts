import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { LegacyService } from '../../legacy/legacy.service';
import { IAvatarRecord, IListAvatarsFilters } from './avatars.interface';
import { BigNumber, constants, Contract, Event, providers } from 'ethers';
import * as abi from '../assets.contract.json';
import { LegacyTypes } from '../../legacy/legacy.constants';
import { Avatar, AvatarAggregationDocument, AvatarDocument } from './avatars.schema';

@Injectable()
export class AvatarsService {
  private readonly logger = new Logger(AvatarsService.name);
  private readonly provider: providers.JsonRpcProvider;
  private readonly contract: Contract;
  private readonly perPage: number = 10;

  constructor(
    private readonly config: ConfigService,
    private readonly legacyService: LegacyService,
    @InjectModel(Avatar.name) private readonly avatarModel: Model<AvatarDocument>,
  ) {
    this.provider = new providers.JsonRpcProvider(config.get<string>('provider.rpc'));
    this.contract = new Contract(config.get<string>('provider.assets.avatar'), abi, this.provider);
    this.contract.on(this.contract.filters.Transfer(), (from: string, to: string, tokenId: BigNumber, event: Event) => {
      void this.contractEvent(from, to, tokenId, event);
    });
  }

  async findOne(id: string, user = ''): Promise<IAvatarRecord> {
    await this.avatarModel.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
    const [avatar] = await this.avatarModel.aggregate<AvatarAggregationDocument>([
      { $match: { _id: new Types.ObjectId(id) } },
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
          games: { $size: '$gamesUsed' },
          lastUsed: '$lastUsed.createdAt',
        },
      },
    ]);
    if (!avatar) {
      return null;
    }
    return this.toAvatarRecord(avatar);
  }

  async find(filters: IListAvatarsFilters): Promise<IAvatarRecord[]> {
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
    return this.aggregateAvatars(matchParams, sortParams, filters.page, filters.user);
  }

  private async aggregateAvatars(
    matchParams: Record<string, any>,
    sortParams: Record<string, any>,
    page: number,
    user = '',
  ): Promise<IAvatarRecord[]> {
    const avatars: IAvatarRecord[] = [];
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

  private toAvatarRecord(avatar: AvatarAggregationDocument): IAvatarRecord {
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

  private async contractEvent(from: string, to: string, tokenId: BigNumber, event: Event): Promise<void> {
    try {
      if (from === constants.AddressZero) {
        this.logger.log(`mint avatar (${to}, ${tokenId.toString()})`);
        await this.create(to, tokenId.toString(), event);
        // const tokenDNA = await this.contract.tokenURI(tokenId);
      } else {
        this.logger.log(`transfer avatar (${from}, ${to}, ${tokenId.toString()})`);
        await this.transfer(from, to, tokenId.toString(), event);
      }
    } catch (err) {
      this.logger.log(err);
    }
  }

  private async create(owner: string, tokenId: string, event: Event): Promise<void> {
    const avatar = await this.avatarModel.create({ owner, owners: [owner], tokenId });
    await this.legacyService.assetMinted(owner, avatar.id, LegacyTypes.AvatarMinted, {
      txHash: event.transactionHash,
      to: owner,
    });
  }

  private async transfer(from: string, to: string, tokenId: string, event: Event): Promise<void> {
    const asset = await this.avatarModel.findOneAndUpdate(
      { tokenId },
      {
        $set: { owner: to },
        $push: { owners: from },
      },
      { new: true },
    );
    await this.legacyService.assetTransferred(to, asset.id, LegacyTypes.AvatarTransferred, {
      from,
      to,
      txHash: event.transactionHash,
    });
  }
}
