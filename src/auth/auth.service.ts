import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IMeResponse } from './interfaces/user-profile';
import { UserProfile, UserProfileDocument } from './schemas/user-profile';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserProfile.name)
    private readonly userProfileModel: Model<UserProfileDocument>,
  ) {}

  async getMe(user: string): Promise<IMeResponse> {
    const profile = await this.userProfileModel.findOne({ publicKey: user });

    let result = {};
    if (profile) {
      result = profile;
    } else {
      result = await this.userProfileModel.create({
        publicKey: user,
        welcomeTokens: 0,
      });
    }
    return result;
  }

  async updateMe(user: string, payload: IMeResponse): Promise<IMeResponse> {
    const profile = await this.userProfileModel.findOne({ publicKey: user });

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }
    if (profile.welcomeTokens !== 0 && payload.welcomeTokens === 0) {
      throw new BadRequestException('You can`t update welcome tokens in that way');
    }

    profile.set({ ...payload });

    await profile.save();

    return profile;
  }
}
