import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { AssetQueue, LegacyQueue } from '../config/queues/assets';
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
import { AssetsOwnershipHistory, AssetsOwnershipHistorySchema } from './schemas/assetsOwnershipHistory';
import { ExplorerModule } from '../explorer/explorer.module';
import { AvatarsProcessor } from './avatars.processor';
import { ItemsProcessor } from './items.processor';
import { GemsProcessor } from './gems.processor';
import { AvatarsLegacyProcessor, GemsLegacyProcessor, ItemsLegacyProcessor } from './legacy.processor';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    LegacyModule,
    BullModule.registerQueue({ name: AssetQueue.Avatars }),
    BullModule.registerQueue({ name: AssetQueue.Items }),
    BullModule.registerQueue({ name: AssetQueue.Gems }),
    BullModule.registerQueue({ name: LegacyQueue.Avatars }),
    BullModule.registerQueue({ name: LegacyQueue.Items }),
    BullModule.registerQueue({ name: LegacyQueue.Gems }),
    MongooseModule.forFeature([
      { name: Avatar.name, schema: AvatarSchema },
      { name: AvatarLike.name, schema: AvatarLikeSchema },
      { name: Item.name, schema: ItemSchema },
      { name: ItemLike.name, schema: ItemLikeSchema },
      { name: Gem.name, schema: GemSchema },
      { name: GemLike.name, schema: GemLikeSchema },
      { name: LegacyRecord.name, schema: LegacyRecordSchema },
      { name: AssetsOwnershipHistory.name, schema: AssetsOwnershipHistorySchema },
    ]),
    ExplorerModule,
  ],
  controllers: [AssetsController],
  providers: [
    AssetsService,
    AvatarsProcessor,
    ItemsProcessor,
    GemsProcessor,
    AvatarsLegacyProcessor,
    GemsLegacyProcessor,
    ItemsLegacyProcessor,
  ],
})
export class AssetsModule {}
