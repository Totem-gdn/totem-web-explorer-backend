import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { Game, GameSchema } from './schemas/game.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Game.name, schema: GameSchema }
    ]),
  ],
  controllers: [GamesController],
  providers: [GamesService]
})
export class GamesModule {
}
