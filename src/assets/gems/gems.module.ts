import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GemsController } from './gems.controller';
import { GemsService } from './gems.service';
import { Gem, GemSchema } from './schemas/gems';
import { GemLike, GemLikeSchema } from './schemas/gemLikes';
import { LegacyRecord, LegacyRecordSchema } from '../../legacy/legacy.schema';
import { LegacyModule } from '../../legacy/legacy.module';
import { BullModule } from '@nestjs/bull';
import { AssetQueue } from '../../config/queues/assets';

@Module({
  imports: [
    ConfigModule,
    LegacyModule,
    BullModule.registerQueue({ name: AssetQueue.Gems }),
    MongooseModule.forFeature([
      { name: Gem.name, schema: GemSchema },
      { name: GemLike.name, schema: GemLikeSchema },
      { name: LegacyRecord.name, schema: LegacyRecordSchema },
    ]),
  ],
  controllers: [GemsController],
  providers: [GemsService],
})
export class GemsModule {}
