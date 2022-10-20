import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { AssetQueue } from '../config/queues/assets';
import { LegacyModule } from '../legacy/legacy.module';
import { LegacyRecord, LegacyRecordSchema } from '../legacy/legacy.schema';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { Avatar, AvatarSchema } from './schemas/avatars';
import { AvatarLike, AvatarLikeSchema } from './schemas/avatarLikes';
import { Item, ItemSchema } from './schemas/items';
import { ItemLike, ItemLikeSchema } from './schemas/itemLikes';
import { Gem, GemSchema } from './schemas/gems';
import { GemLike, GemLikeSchema } from './schemas/gemLikes';

@Module({
  imports: [
    ConfigModule,
    LegacyModule,
    BullModule.registerQueue({ name: AssetQueue.Avatars }),
    BullModule.registerQueue({ name: AssetQueue.Items }),
    BullModule.registerQueue({ name: AssetQueue.Gems }),
    MongooseModule.forFeature([
      { name: Avatar.name, schema: AvatarSchema },
      { name: AvatarLike.name, schema: AvatarLikeSchema },
      { name: Item.name, schema: ItemSchema },
      { name: ItemLike.name, schema: ItemLikeSchema },
      { name: Gem.name, schema: GemSchema },
      { name: GemLike.name, schema: GemLikeSchema },
      { name: LegacyRecord.name, schema: LegacyRecordSchema },
    ]),
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}
