import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { GamesModule } from './games/games.module';
import { AssetsModule } from './assets/assets.module';
import { AuthModule } from './auth/auth.module';
import { BlocksModule } from './blocks/blocks.module';
import { MessagesModule } from './messages/messages.module';
import { PingModule } from './ping/ping.module';
import { PaymentModule } from './payment/payment.module';
import { PropertiesModule } from './properties/properties.module';

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
      {
        path: 'payment',
        module: PaymentModule,
      },
      {
        path: 'properties',
        module: PropertiesModule,
      },
    ]),
  ],
})
export class AppRouterModule {}
