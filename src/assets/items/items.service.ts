import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item, ItemAggregationDocument, ItemDocument } from './items.schema';
import { ConfigService } from '@nestjs/config';
import { LegacyService } from '../../legacy/legacy.service';
import { IItemRecord, IListItemsFilters } from './items.interface';
import { BigNumber, constants, Contract, Event, providers } from 'ethers';
import * as abi from '../assets.contract.json';
import { LegacyTypes } from '../../legacy/legacy.constants';

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);
  private readonly provider: providers.JsonRpcProvider;
  private readonly contract: Contract;
  private readonly perPage: number = 10;

  constructor(
    private readonly config: ConfigService,
    private readonly legacyService: LegacyService,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
  ) {
    // items contract provider
    this.provider = new providers.JsonRpcProvider(config.get<string>('provider.rpc'));
    this.contract = new Contract(config.get<string>('provider.assets.item'), abi, this.provider);
    this.contract.on(this.contract.filters.Transfer(), (from: string, to: string, tokenId: BigNumber, event: Event) => {
      void this.contractEvent(from, to, tokenId, event);
    });
  }

  async findOne(id: string, user = ''): Promise<IItemRecord> {
    await this.itemModel.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
    const [item] = await this.itemModel.aggregate<ItemAggregationDocument>([
      { $match: { _id: new Types.ObjectId(id) } },
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
          games: { $size: '$gamesUsed' },
          lastUsed: '$lastUsed.createdAt',
        },
      },
    ]);
    if (!item) {
      return null;
    }
    return this.toItemRecord(item);
  }

  async find(filters: IListItemsFilters): Promise<IItemRecord[]> {
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
  ): Promise<IItemRecord[]> {
    const items: IItemRecord[] = [];
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

  private toItemRecord(item: ItemAggregationDocument): IItemRecord {
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

  private async contractEvent(from: string, to: string, tokenId: BigNumber, event: Event): Promise<void> {
    try {
      if (from === constants.AddressZero) {
        this.logger.log(`mint item (${to}, ${tokenId.toString()})`);
        await this.create(to, tokenId.toString(), event);
        // const tokenDNA = await this.contract.tokenURI(tokenId);
      } else {
        this.logger.log(`transfer item (${from}, ${to}, ${tokenId.toString()})`);
        await this.transfer(from, to, tokenId.toString(), event);
      }
    } catch (err) {
      this.logger.log(err);
    }
  }

  private async create(owner: string, tokenId: string, event: Event): Promise<void> {
    const item = await this.itemModel.create({ owner, owners: [owner], tokenId });
    await this.legacyService.assetMinted(owner, item.id, LegacyTypes.ItemMinted, {
      txHash: event.transactionHash,
      to: owner,
    });
  }

  private async transfer(from: string, to: string, tokenId: string, event: Event): Promise<void> {
    const asset = await this.itemModel.findOneAndUpdate(
      { tokenId },
      {
        $set: { owner: to },
        $push: { owners: from },
      },
      { new: true },
    );
    await this.legacyService.assetTransferred(to, asset.id, LegacyTypes.ItemTransferred, {
      from,
      to,
      txHash: event.transactionHash,
    });
  }
}
