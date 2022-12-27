import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { Game, GamesSchema } from './schemas/games';
import { LegacyModule } from '../legacy/legacy.module';
import { LegacyService } from '../legacy/legacy.service';
import { LegacyRecord, LegacyRecordSchema } from '../legacy/legacy.schema';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { GameDirectoryProcessor } from './game-directory.processor';

@Module({
  imports: [
    ConfigModule,
    LegacyModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: Game.name, schema: GamesSchema },
      { name: LegacyRecord.name, schema: LegacyRecordSchema },
    ]),
    BullModule.registerQueue({ name: 'game-directory-queue' }),
  ],
  controllers: [GamesController],
  providers: [GamesService, LegacyService, GameDirectoryProcessor],
})
export class GamesModule {}
