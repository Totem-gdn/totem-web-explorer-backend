import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PageBlocks, PageBlocksSchema } from './schemas/blocks';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: PageBlocks.name,
        schema: PageBlocksSchema,
      },
    ]),
  ],
  controllers: [BlocksController],
  providers: [BlocksService],
})
export class BlocksModule {}
