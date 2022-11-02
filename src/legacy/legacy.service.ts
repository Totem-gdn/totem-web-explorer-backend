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

  async ownershipHistory(assetType: AssetType, assetId: string) {
    return [
      {
        created_at: '2022-10-31T15:06:05.838Z',
        from: '',
        to: '0xC3406512B44Ce941Fd073679d20E613035Dc5008',
      },
      {
        created_at: '2022-11-01T15:06:05.838Z',
        from: '0xC3406512B44Ce941Fd073679d20E613035Dc5008',
        to: '0x19975EF228779Ab0Cd803de843240c13d84EDD9E',
      },
    ];
  }
}
