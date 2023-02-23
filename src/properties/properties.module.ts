import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Properties, PropertiesSchema } from './schemas/properties';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: Properties.name,
        schema: PropertiesSchema,
      },
    ]),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
