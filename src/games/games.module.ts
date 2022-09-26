import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { Game, GamesSchema } from './games.schema';
import { LegacyModule } from '../legacy/legacy.module';
import { LegacyService } from '../legacy/legacy.service';
import { LegacyRecord, LegacyRecordSchema } from '../legacy/legacy.schema';

@Module({
  imports: [
    ConfigModule,
    LegacyModule,
    MongooseModule.forFeature([
      { name: Game.name, schema: GamesSchema },
      { name: LegacyRecord.name, schema: LegacyRecordSchema },
    ]),
  ],
  controllers: [GamesController],
  providers: [GamesService, LegacyService],
})
export class GamesModule {}
