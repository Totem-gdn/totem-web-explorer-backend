import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@nestjs-modules/ioredis';
import appConfig from './config/app.config';
import { HealthModule } from './health/health.module';
import { GamesModule } from './games/games.module';
import { LegacyModule } from './legacy/legacy.module';
import { AssetsModule } from './assets/assets.module';
import { AuthModule } from './auth/auth.module';
import { AppRouterModule } from './router.module';
import { ExplorerModule } from './explorer/explorer.module';
import { BlocksModule } from './blocks/blocks.module';
import { MessagesModule } from './messages/messages.module';
import { PingModule } from './ping/ping.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [appConfig] }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          url: configService.get<string>('redis.uri'),
        },
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.get<string>('redis.uri'), // FIXME: use different databases for different environments, then change prefix
        prefix: configService.get<string>('mongodb.dbName'),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MongooseModuleOptions => ({
        uri: configService.get<string>('mongodb.uri'),
        dbName: configService.get<string>('mongodb.dbName'),
      }),
    }),
    HealthModule,
    LegacyModule,
    ExplorerModule,
    GamesModule,
    AssetsModule,
    AuthModule,
    BlocksModule,
    MessagesModule,
    AppRouterModule,
    PingModule,
    PaymentModule,
  ],
})
export class AppModule {}
