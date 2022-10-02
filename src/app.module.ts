import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import appConfig from './app.config';
import { HealthModule } from './health/health.module';
import { GamesModule } from './games/games.module';
import { LegacyModule } from './legacy/legacy.module';
import { AvatarsModule } from './assets/avatars/avatars.module';
import { ItemsModule } from './assets/items/items.module';
import { GemsModule } from './assets/gems/gems.module';
import { AppRouterModule } from './router.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [appConfig] }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MongooseModuleOptions => ({
        uri: configService.get<string>('mongodb.uri'),
        dbName: configService.get<string>('mongodb.dbName'),
      }),
    }),
    LegacyModule,
    HealthModule,
    GamesModule,
    AvatarsModule,
    ItemsModule,
    GemsModule,
    AppRouterModule,
  ],
})
export class AppModule {}
