import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LegacyRecord, LegacyRecordSchema } from './legacy.schema';
import { LegacyService } from './legacy.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: LegacyRecord.name, schema: LegacyRecordSchema }])],
  providers: [LegacyService],
  exports: [LegacyService],
})
export class LegacyModule {}
