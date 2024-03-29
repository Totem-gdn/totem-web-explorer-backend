import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AssetMetadata } from 'src/assets/common/interfaces/assetRecord';
import { Avatar, AvatarDocument } from 'src/assets/schemas/avatars';
import { Gem, GemDocument } from 'src/assets/schemas/gems';
import { Item, ItemDocument } from 'src/assets/schemas/items';
import { AssetType } from 'src/assets/types/assets';
import { LegacyRecord, LegacyRecordDocument } from 'src/legacy/legacy.schema';
import { ProfileDTO } from './dto/me.dto';
import { IProfileResponse } from './interfaces/user-profile';
import { UserProfile, UserProfileDocument } from './schemas/user-profile';

@Injectable()
export class AuthService {
  private readonly assetsModels: Record<AssetType, Model<AvatarDocument | ItemDocument | GemDocument>>;
  constructor(
    @InjectModel(UserProfile.name)
    private readonly userProfileModel: Model<UserProfileDocument>,
    @InjectModel(LegacyRecord.name)
    private readonly legacyRecordModel: Model<LegacyRecordDocument>,
    @InjectModel(Avatar.name) private readonly avatarModel: Model<AvatarDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Gem.name) private readonly gemModel: Model<GemDocument>,
  ) {
    this.assetsModels = {
      avatars: avatarModel,
      items: itemModel,
      gems: gemModel,
    };
  }

  async getMe(user: string): Promise<IProfileResponse> {
    const profile = await this.userProfileModel.findOne({ publicKey: user });

    let result: IProfileResponse = {};

    if (profile) {
      result = profile.toJSON();
    } else {
      const userCreationResult = await this.userProfileModel.create({
        publicKey: user,
        welcomeTokens: 0,
      });
      result = userCreationResult.toJSON();
    }

    const [items, avatars, gems] = await Promise.all([
      this.getAssetsMetadataForProfile('items', user),
      this.getAssetsMetadataForProfile('avatars', user),
      this.getAssetsMetadataForProfile('gems', user),
    ]);

    const [favoriteItems, favoriteAvatars, favoriteGems] = await Promise.all([
      this.getFavoritesAssetsMetadataForProfile('items', user),
      this.getFavoritesAssetsMetadataForProfile('avatars', user),
      this.getFavoritesAssetsMetadataForProfile('gems', user),
    ]);

    return this.toProfileRecord({ ...result, items, avatars, gems, favoriteItems, favoriteAvatars, favoriteGems });
  }

  async updateMe(user: string, payload: ProfileDTO): Promise<IProfileResponse> {
    const profile = await this.userProfileModel.findOne({ publicKey: user });

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }
    if (profile.welcomeTokens !== 0 && payload.welcomeTokens === 0) {
      throw new BadRequestException('You can`t update welcome tokens in that way');
    }

    profile.set({ ...payload });

    await profile.save();

    const [items, avatars, gems] = await Promise.all([
      this.getAssetsMetadataForProfile('items', user),
      this.getAssetsMetadataForProfile('avatars', user),
      this.getAssetsMetadataForProfile('gems', user),
    ]);

    const [favoriteItems, favoriteAvatars, favoriteGems] = await Promise.all([
      this.getFavoritesAssetsMetadataForProfile('items', user),
      this.getFavoritesAssetsMetadataForProfile('avatars', user),
      this.getFavoritesAssetsMetadataForProfile('gems', user),
    ]);

    return this.toProfileRecord({
      ...profile.toJSON(),
      items,
      avatars,
      gems,
      favoriteItems,
      favoriteAvatars,
      favoriteGems,
    });
  }

  private toProfileRecord(profile) {
    return {
      id: profile._id,
      publicKey: profile.publicKey,
      welcomeTokens: profile.welcomeTokens,
      meta: {
        own: {
          items: profile.items,
          avatars: profile.avatars,
          gems: profile.gems,
        },
        favorites: {
          items: profile.favoriteItems,
          avatars: profile.favoriteAvatars,
          gems: profile.favoriteGems,
        },
      },
    };
  }

  private async getFavoritesAssetsMetadataForProfile(assetType: AssetType, user: string) {
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
    const favoritesIDS = await this.legacyRecordModel.find({ type, user }, { gameId: 1, assetId: 1 });

    const ids = favoritesIDS.map((f) => {
      return f.assetId ? f.assetId : f.gameId;
    });

    const assets = await this.assetsModels[assetType].find({ _id: { $in: ids } }).exec();

    const result = {
      all: 0,
      rare: 0,
      unique: 0,
    };
    for (const asset of assets) {
      result.all++;
      const rarity = Number(asset.tokenId) % 100;
      if (rarity >= 80 && rarity < 90) {
        result.rare++;
      }
      if (rarity >= 90) {
        result.unique++;
      }
    }
    return result;
  }

  private async getAssetsMetadataForProfile(assetType: AssetType, owner: string): Promise<AssetMetadata> {
    const assets = await this.assetsModels[assetType].find({ owner }).exec();

    const result = {
      all: 0,
      rare: 0,
      unique: 0,
    };
    for (const asset of assets) {
      result.all++;
      const rarity = Number(asset.tokenId) % 100;
      if (rarity >= 80 && rarity < 90) {
        result.rare++;
      }
      if (rarity >= 90) {
        result.unique++;
      }
    }
    return result;
  }
}
