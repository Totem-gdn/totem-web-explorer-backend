import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AvatarsController } from './avatars.controller';
import { AvatarsService } from './avatars.service';
import { Avatar, AvatarSchema } from './schemas/avatars';
import { AvatarLike, AvatarLikeSchema } from './schemas/avatarLikes';
import { LegacyRecord, LegacyRecordSchema } from '../../legacy/legacy.schema';
import { LegacyModule } from '../../legacy/legacy.module';
import { BullModule } from '@nestjs/bull';
import { AssetQueue } from '../../config/queues/assets';

@Module({
  imports: [
    ConfigModule,
    LegacyModule,
    BullModule.registerQueue({ name: AssetQueue.Avatars }),
    MongooseModule.forFeature([
      { name: Avatar.name, schema: AvatarSchema },
      { name: AvatarLike.name, schema: AvatarLikeSchema },
      { name: LegacyRecord.name, schema: LegacyRecordSchema },
    ]),
  ],
  controllers: [AvatarsController],
  providers: [AvatarsService],
})
export class AvatarsModule {}
