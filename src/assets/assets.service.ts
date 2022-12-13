import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isMongoId } from 'class-validator';
import { AssetAggregationDocument } from './types/document';
import { AssetMetadata, AssetRecord } from './common/interfaces/assetRecord';
import { ListAssetsFilter } from './interfaces/filters';
import { LegacyService } from '../legacy/legacy.service';
import { LegacyEvents } from '../legacy/enums/legacy.enums';
import { LegacyLikedType, LegacyUsedType } from '../legacy/types/legacy.types';
import { ExplorerService } from '../explorer/explorer.service';
import { Avatar, AvatarDocument } from './schemas/avatars';
import { AvatarLike, AvatarLikeDocument } from './schemas/avatarLikes';
import { Item, ItemDocument } from './schemas/items';
import { ItemLike, ItemLikeDocument } from './schemas/itemLikes';
import { Gem, GemDocument } from './schemas/gems';
import { GemLike, GemLikeDocument } from './schemas/gemLikes';
import { AssetType } from './types/assets';
import { AssetsOwnershipHistory, AssetsOwnershipHistoryDocument } from './schemas/assetsOwnershipHistory';

@Injectable()
export class AssetsService {
  private readonly perPage: number = 10;
  private readonly assetsModels: Record<AssetType, Model<AvatarDocument | ItemDocument | GemDocument>>;
  private readonly assetLikesModels: Record<AssetType, Model<AvatarLikeDocument | ItemLikeDocument | GemLikeDocument>>;
  private readonly assetLikesTypes: Record<AssetType, LegacyLikedType> = {
    avatars: LegacyEvents.AvatarLiked,
    items: LegacyEvents.ItemLiked,
    gems: LegacyEvents.GemLiked,
  };
  private readonly assetUsedTypes: Record<AssetType, LegacyUsedType> = {
    avatars: LegacyEvents.AvatarUsed,
    items: LegacyEvents.ItemUsed,
    gems: LegacyEvents.GemUsed,
  };

  constructor(
    private readonly config: ConfigService,
    private readonly legacyService: LegacyService,
    private readonly explorerService: ExplorerService,
    @InjectModel(Avatar.name) private readonly avatarModel: Model<AvatarDocument>,
    @InjectModel(AvatarLike.name) private readonly avatarLikeModel: Model<AvatarLikeDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(ItemLike.name) private readonly itemLikeModel: Model<ItemLikeDocument>,
    @InjectModel(Gem.name) private readonly gemModel: Model<GemDocument>,
    @InjectModel(GemLike.name) private readonly gemLikeModel: Model<GemLikeDocument>,
    @InjectModel(AssetsOwnershipHistory.name) private readonly ownershipModel: Model<AssetsOwnershipHistoryDocument>,
  ) {
    this.assetsModels = {
      avatars: avatarModel,
      items: itemModel,
      gems: gemModel,
    };
    // TODO: change legacy to direct asset likes
    this.assetLikesModels = {
      avatars: avatarLikeModel,
      items: itemLikeModel,
      gems: gemLikeModel,
    };
  }

  async findOne(assetType: AssetType, id: string, user = ''): Promise<AssetRecord> {
    const matchParams: Record<string, any> = {};
    if (isMongoId(id)) {
      matchParams._id = new Types.ObjectId(id);
    } else {
      matchParams.tokenId = id;
    }
    await this.assetsModels[assetType].findOneAndUpdate({ ...matchParams }, { $inc: { views: 1 } }).exec();
    const [asset] = await this.assetsModels[assetType].aggregate<AssetAggregationDocument>([
      { $match: { ...matchParams } },
      this.isLikedLookupPipeline(assetType, user),
      this.likesLookupPipeline(assetType),
      this.gamesLookupPipeline(assetType),
      this.lastUsedLookupPipeline(assetType),
      {
        $addFields: {
          isLiked: { $gt: [{ $size: '$isLiked' }, 0] },
          likes: { $size: '$likes' },
          games: { $size: '$games' },
          lastUsed: '$lastUsed.createdAt',
        },
      },
    ]);
    if (!asset) {
      return null;
    }
    return this.toRecord(asset);
  }

  async find(assetType: AssetType, filters: ListAssetsFilter): Promise<AssetRecord[]> {
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
    if (filters.ids) {
      matchParams['_id'] = { $in: filters.ids };
    }
    const sortParams: Record<string, any> = {};
    if (filters.list === 'popular') {
      // sortParams.views = -1;
      sortParams.legacyEventsAmount = -1;
    } else {
      sortParams.createdAt = -1;
    }
    const assets: AssetRecord[] = [];
    const aggregation = this.assetsModels[assetType].aggregate<AssetAggregationDocument>([
      { $match: { ...matchParams } },
      { $sort: { ...sortParams } },
      { $skip: (filters.page - 1) * this.perPage },
      { $limit: this.perPage },
      this.isLikedLookupPipeline(assetType, filters.user),
      this.likesLookupPipeline(assetType),
      this.gamesLookupPipeline(assetType),
      this.lastUsedLookupPipeline(assetType),
      {
        $addFields: {
          isLiked: { $gt: [{ $size: '$isLiked' }, 0] },
          likes: { $size: '$likes' },
          games: { $size: '$games' },
          lastUsed: '$lastUsed.createdAt',
        },
      },
    ]);
    for (const asset of await aggregation.exec()) {
      assets.push(await this.toRecord(asset));
    }
    return assets;
  }

  private isLikedLookupPipeline(assetType: AssetType, user: string) {
    return this.legacyLookupPipeline('isLiked', [
      {
        $match: {
          type: this.assetLikesTypes[assetType],
          user,
        },
      },
    ]);
  }

  private likesLookupPipeline(assetType: AssetType) {
    return this.legacyLookupPipeline('likes', [
      {
        $match: {
          type: this.assetLikesTypes[assetType],
        },
      },
    ]);
  }

  private gamesLookupPipeline(assetType: AssetType) {
    return this.legacyLookupPipeline('games', [
      {
        $match: {
          type: this.assetUsedTypes[assetType],
        },
      },
    ]);
  }

  private lastUsedLookupPipeline(assetType: AssetType) {
    return this.legacyLookupPipeline('lastUsed', [
      {
        $match: {
          type: this.assetUsedTypes[assetType],
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: 1,
      },
    ]);
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

  private toRecord(asset: AssetAggregationDocument): AssetRecord {
    return {
      id: asset._id.toString(),
      owner: asset.owner,
      owners: asset.owners,
      tokenId: asset.tokenId,
      views: asset.views,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      isLiked: asset.isLiked,
      likes: asset.likes,
      games: asset.games,
      lastUsed: asset.lastUsed[0] || '',
    };
  }

  async ownershipHistory(assetType: AssetType, assetId: string) {
    const history = this.ownershipModel.find({
      tokenType: { $in: [new RegExp(assetType, 'gi')] },
      tokenId: assetId.toString(),
    });

    return history;
  }

  async legacyHistory(assetType: AssetType, assetId: string) {
    let item;
    switch (assetType + '') {
      case 'avatar':
      case 'avatars':
        item = await this.avatarModel.findOne({ tokenId: assetId.toString() });
        break;
      case 'item':
      case 'items':
        item = await this.itemModel.findOne({ tokenId: assetId.toString() });
        break;
      case 'gem':
      case 'gems':
        item = await this.gemModel.findOne({ tokenId: assetId.toString() });
        break;
    }

    if (!item) {
      throw new BadRequestException('Item not found');
    }

    const history = await this.legacyService.getLegacyHistory(item._id.toString());

    return history;
  }

  async getFavorites(assetType: AssetType, user: string, page: number): Promise<AssetRecord[]> {
    let type;
    switch (assetType) {
      case 'avatars':
        type = 'avatarLiked';
        break;
      case 'items':
        type = 'itemLiked';
        break;
      case 'gems':
        type = 'gemLiked';
        break;
    }
    const favoritesIDs = await this.legacyService.getFavoritesIDs(type, user, page, this.perPage);

    const result = await this.find(assetType, { ids: favoritesIDs, list: 'latest', page: 1, user });

    return result;
  }
}
