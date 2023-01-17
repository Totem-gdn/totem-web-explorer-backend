import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { GamesModule } from './games/games.module';
import { AssetsModule } from './assets/assets.module';
import { AuthModule } from './auth/auth.module';
import { BlocksModule } from './blocks/blocks.module';
import { MessagesModule } from './messages/messages.module';
import { PingModule } from './ping/ping.module';

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
      {
        path: '',
        module: AuthModule,
      },
      {
        path: 'blocks',
        module: BlocksModule,
      },
      {
        path: 'messages',
        module: MessagesModule,
      },
      {
        path: 'ping',
        module: PingModule,
      },
    ]),
  ],
})
export class AppRouterModule {}
