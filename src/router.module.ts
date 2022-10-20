import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { GamesModule } from './games/games.module';
import { AssetsModule } from './assets/assets.module';

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'games',
        module: GamesModule,
      },
      {
        path: 'assets',
        module: AssetsModule,
      },
    ]),
  ],
})
export class AppRouterModule {}
