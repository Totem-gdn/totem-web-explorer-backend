import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProfile, UserProfileSchema } from './schemas/user-profile';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Avatar, AvatarSchema } from 'src/assets/schemas/avatars';
import { Item, ItemSchema } from 'src/assets/schemas/items';
import { Gem, GemSchema } from 'src/assets/schemas/gems';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: Avatar.name, schema: AvatarSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Gem.name, schema: GemSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
