import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LegacyRecord, LegacyRecordDocument } from './legacy.schema';
import { LegacyEvents } from './enums/legacy.enums';
import { LegacyAddedType, LegacyLikedType, LegacyUsedType } from './types/legacy.types';
import { AssetType } from '../assets/types/assets';

@Injectable()
export class LegacyService {
  private readonly assetAddedTypes: Record<AssetType, LegacyAddedType> = {
    avatars: LegacyEvents.AvatarAdded,
    items: LegacyEvents.ItemAdded,
    gems: LegacyEvents.GemAdded,
  };
  private readonly assetLikeTypes: Record<AssetType, LegacyLikedType> = {
    avatars: LegacyEvents.AvatarLiked,
    items: LegacyEvents.ItemLiked,
    gems: LegacyEvents.GemLiked,
  };
  private readonly assetUsedTypes: Record<AssetType, LegacyUsedType> = {
    avatars: LegacyEvents.AvatarUsed,
    items: LegacyEvents.ItemUsed,
    gems: LegacyEvents.GemUsed,
  };

  constructor(@InjectModel(LegacyRecord.name) private readonly legacyRecordModel: Model<LegacyRecordDocument>) {}

  async gamePlayed(user: string, gameId: string) {
    const record = await this.legacyRecordModel.findOne({ user, gameId, type: LegacyEvents.GamePlayed }).exec();
    if (!record) {
      await this.legacyRecordModel.create({ user, assetId: null, gameId, type: LegacyEvents.GamePlayed, data: null });
    }
  }

  async likeGame(user: string, gameId: string) {
    const record = await this.legacyRecordModel.findOne({ user, gameId, type: LegacyEvents.GameLiked }).exec();
    if (!record) {
      await this.legacyRecordModel.create({ user, assetId: null, gameId, type: LegacyEvents.GameLiked, data: null });
    }
  }

  async dislikeGame(user: string, gameId: string) {
    // delete all like records, if somehow we created multiple
    await this.legacyRecordModel.deleteMany({ user, gameId, type: LegacyEvents.GameLiked }).exec();
  }

  async addAssetToGame(assetType: AssetType, user: string, assetId: string, gameId: string) {
    const type = this.assetAddedTypes[assetType];
    const record = await this.legacyRecordModel.findOne({ user, assetId, type }).exec();
    if (!record) {
      await this.legacyRecordModel.create({ user, assetId, gameId, type, data: null });
    }
  }

  async likeAsset(assetType: AssetType, user: string, assetId: string) {
    const type = this.assetLikeTypes[assetType];
    const record = await this.legacyRecordModel.findOne({ user, assetId, type }).exec();
    if (!record) {
      await this.legacyRecordModel.create({ user, assetId, gameId: null, type, data: null });
    }
  }

  async dislikeAsset(assetType: AssetType, user: string, assetId: string) {
    // delete all like records, if somehow we created multiple
    await this.legacyRecordModel.deleteMany({ user, assetId, type: this.assetLikeTypes[assetType] }).exec();
  }

  async useAssetInGame(assetType: AssetType, user: string, itemId: string, gameId: string, data: any) {
    await this.legacyRecordModel.create({ user, assetId: itemId, gameId, type: this.assetUsedTypes[assetType], data });
  }

  async getLegacyHistory(assetId: string) {
    return await this.legacyRecordModel.find({ assetId });
  }

  async getFavoritesIDs(
    type: 'avatarLiked' | 'gemLiked' | 'itemLiked' | 'gameLiked',
    user: string,
    page: number,
    perPage: number,
  ) {
    const count = await this.legacyRecordModel.countDocuments({ type, user });

    const favorites = await this.legacyRecordModel
      .find({ type, user }, { gameId: 1, assetId: 1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const ids = favorites.map((f) => {
      return f.assetId ? f.assetId : f.gameId;
    });

    return { count, ids };
  }
}
