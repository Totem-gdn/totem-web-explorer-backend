import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { HealthModule } from './controllers/health/health.module';
import { GamesModule } from './controllers/games/games.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MongooseModuleOptions => ({
        uri: configService.get<string>('mongodb.uri'),
        dbName: configService.get<string>('mongodb.dbName')
      })
    }),
    HealthModule,
    GamesModule,
  ],
})
export class AppModule {}
