import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AvatarsController } from './avatars.controller';
import { AvatarsService } from './avatars.service';
import { Avatar, AvatarSchema } from './avatars.schema';
import { LegacyRecord, LegacyRecordSchema } from '../../legacy/legacy.schema';
import { LegacyModule } from '../../legacy/legacy.module';

@Module({
  imports: [
    ConfigModule,
    LegacyModule,
    MongooseModule.forFeature([
      { name: Avatar.name, schema: AvatarSchema },
      { name: LegacyRecord.name, schema: LegacyRecordSchema },
    ]),
  ],
  controllers: [AvatarsController],
  providers: [AvatarsService],
})
export class AvatarsModule {}
