import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExplorerService } from './explorer.service';
import { BullModule } from '@nestjs/bull';
import { AssetQueue } from '../config/queues/assets';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({ name: AssetQueue.Avatars }),
    BullModule.registerQueue({ name: AssetQueue.Items }),
    BullModule.registerQueue({ name: AssetQueue.Gems }),
  ],
  providers: [ExplorerService],
})
export class ExplorerModule {}
