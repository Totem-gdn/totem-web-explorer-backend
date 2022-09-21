import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GemsController } from './gems.controller';
import { GemsService } from './gems.service';
import { Gem, GemSchema } from './gems.schema';
import { LegacyRecord, LegacyRecordSchema } from '../../legacy/legacy.schema';
import { LegacyModule } from '../../legacy/legacy.module';

@Module({
  imports: [
    ConfigModule,
    LegacyModule,
    MongooseModule.forFeature([
      { name: Gem.name, schema: GemSchema },
      { name: LegacyRecord.name, schema: LegacyRecordSchema },
    ]),
  ],
  controllers: [GemsController],
  providers: [GemsService],
})
export class GemsModule {}
