import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { GamesModule } from './games/games.module';
import { AvatarsModule } from './assets/avatars/avatars.module';
import { ItemsModule } from './assets/items/items.module';
import { GemsModule } from './assets/gems/gems.module';

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'games',
        module: GamesModule,
      },
      {
        path: 'assets',
        children: [
          {
            path: 'avatars',
            module: AvatarsModule,
          },
          {
            path: 'items',
            module: ItemsModule,
          },
          {
            path: 'gems',
            module: GemsModule,
          },
        ],
      },
    ]),
  ],
})
export class AppRouterModule {}
