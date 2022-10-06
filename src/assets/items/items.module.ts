import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Item, ItemSchema } from './schemas/items';
import { ItemLike, ItemLikeSchema } from './schemas/itemLikes';
import { LegacyRecord, LegacyRecordSchema } from '../../legacy/legacy.schema';
import { LegacyModule } from '../../legacy/legacy.module';
import { BullModule } from '@nestjs/bull';
import { AssetQueue } from '../../config/queues/assets';

@Module({
  imports: [
    ConfigModule,
    LegacyModule,
    BullModule.registerQueue({ name: AssetQueue.Items }),
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: ItemLike.name, schema: ItemLikeSchema },
      { name: LegacyRecord.name, schema: LegacyRecordSchema },
    ]),
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
