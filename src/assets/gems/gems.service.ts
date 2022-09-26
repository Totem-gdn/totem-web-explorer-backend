import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Gem, GemAggregationDocument, GemDocument } from './gems.schema';
import { ConfigService } from '@nestjs/config';
import { LegacyService } from '../../legacy/legacy.service';
import { IGemRecord, IListGemsFilters } from './gems.interface';
import { BigNumber, constants, Contract, Event, providers } from 'ethers';
import * as abi from '../assets.contract.json';
import { LegacyTypes } from '../../legacy/legacy.constants';

@Injectable()
export class GemsService {
  private readonly logger = new Logger(GemsService.name);
  private readonly provider: providers.JsonRpcProvider;
  private readonly contract: Contract;
  private readonly perPage: number = 10;

  constructor(
    private readonly config: ConfigService,
    private readonly legacyService: LegacyService,
    @InjectModel(Gem.name) private readonly gemModel: Model<GemDocument>,
  ) {
    this.provider = new providers.JsonRpcProvider(config.get<string>('provider.rpc'));
    this.contract = new Contract(config.get<string>('provider.assets.gem'), abi, this.provider);
    this.contract.on(this.contract.filters.Transfer(), (from: string, to: string, tokenId: BigNumber, event: Event) => {
      void this.contractEvent(from, to, tokenId, event);
    });
  }

  async findOne(id: string, user = ''): Promise<IGemRecord> {
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
          games: { $size: '$gamesUsed' },
          lastUsed: '$lastUsed.createdAt',
        },
      },
    ]);
    if (!gem) {
      return null;
    }
    return this.toGemRecord(gem);
  }

  async find(filters: IListGemsFilters): Promise<IGemRecord[]> {
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
  ): Promise<IGemRecord[]> {
    const gems: IGemRecord[] = [];
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

  private toGemRecord(gem: GemAggregationDocument): IGemRecord {
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

  private async contractEvent(from: string, to: string, tokenId: BigNumber, event: Event): Promise<void> {
    try {
      if (from === constants.AddressZero) {
        this.logger.log(`mint gem (${to}, ${tokenId.toString()})`);
        await this.create(to, tokenId.toString(), event);
        // const tokenDNA = await this.contract.tokenURI(tokenId);
      } else {
        this.logger.log(`transfer gem (${from}, ${to}, ${tokenId.toString()})`);
        await this.transfer(from, to, tokenId.toString(), event);
      }
    } catch (err) {
      this.logger.log(err);
    }
  }

  private async create(owner: string, tokenId: string, event: Event): Promise<void> {
    const gem = await this.gemModel.create({ owner, owners: [owner], tokenId });
    await this.legacyService.assetMinted(owner, gem.id, LegacyTypes.GemMinted, {
      txHash: event.transactionHash,
      to: owner,
    });
  }

  private async transfer(from: string, to: string, tokenId: string, event: Event): Promise<void> {
    const asset = await this.gemModel.findOneAndUpdate(
      { tokenId },
      {
        $set: { owner: to },
        $push: { owners: from },
      },
      { new: true },
    );
    await this.legacyService.assetTransferred(to, asset.id, LegacyTypes.GemTransferred, {
      from,
      to,
      txHash: event.transactionHash,
    });
  }
}
