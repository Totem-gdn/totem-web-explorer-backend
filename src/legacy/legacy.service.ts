import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LegacyRecord, LegacyRecordDocument } from './legacy.schema';
import { LegacyTypes } from './legacy.constants';

@Injectable()
export class LegacyService {
  constructor(@InjectModel(LegacyRecord.name) private readonly legacyRecordModel: Model<LegacyRecordDocument>) {}

  async gamePlayed(user: string, gameId: string) {
    const record = await this.legacyRecordModel.findOne({ user, gameId, type: LegacyTypes.GamePlayed }).exec();
    if (!record) {
      await this.legacyRecordModel.create({ user, assetId: null, gameId, type: LegacyTypes.GamePlayed, data: null });
    }
  }

  async likeGame(user: string, gameId: string) {
    const record = await this.legacyRecordModel.findOne({ user, gameId, type: LegacyTypes.GameLiked }).exec();
    if (!record) {
      await this.legacyRecordModel.create({ user, assetId: null, gameId, type: LegacyTypes.GameLiked, data: null });
    }
  }

  async dislikeGame(user: string, gameId: string) {
    // delete all like records, if somehow we created multiple
    await this.legacyRecordModel.deleteMany({ user, gameId, type: LegacyTypes.GameLiked }).exec();
  }

  async addAssetToGame(
    user: string,
    assetId: string,
    gameId: string,
    type: LegacyTypes.AvatarAdded | LegacyTypes.ItemAdded | LegacyTypes.GemAdded,
  ) {
    const record = await this.legacyRecordModel.findOne({ user, assetId, type }).exec();
    if (!record) {
      await this.legacyRecordModel.create({ user, assetId, gameId, type, data: null });
    }
  }

  async likeAsset(
    user: string,
    assetId: string,
    type: LegacyTypes.AvatarLiked | LegacyTypes.ItemLiked | LegacyTypes.GemLiked,
  ) {
    const record = await this.legacyRecordModel.findOne({ user, assetId, type }).exec();
    if (!record) {
      await this.legacyRecordModel.create({ user, assetId, gameId: null, type, data: null });
    }
  }

  async dislikeAsset(
    user: string,
    assetId: string,
    type: LegacyTypes.AvatarLiked | LegacyTypes.ItemLiked | LegacyTypes.GemLiked,
  ) {
    // delete all like records, if somehow we created multiple
    await this.legacyRecordModel.deleteMany({ user, assetId, type }).exec();
  }

  async useAssetInGame(
    user: string,
    itemId: string,
    gameId: string,
    type: LegacyTypes.AvatarUsed | LegacyTypes.ItemUsed | LegacyTypes.GemUsed,
    data: any,
  ) {
    await this.legacyRecordModel.create({ user, assetId: itemId, gameId, type, data });
  }
}
