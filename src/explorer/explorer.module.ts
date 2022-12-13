import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExplorerService } from './explorer.service';
import { BullModule } from '@nestjs/bull';
import { AssetQueue, LegacyQueue } from '../config/queues/assets';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({ name: AssetQueue.Avatars }),
    BullModule.registerQueue({ name: AssetQueue.Items }),
    BullModule.registerQueue({ name: AssetQueue.Gems }),
    BullModule.registerQueue({ name: LegacyQueue.Avatars }),
    BullModule.registerQueue({ name: LegacyQueue.Items }),
    BullModule.registerQueue({ name: LegacyQueue.Gems }),
  ],
  providers: [ExplorerService],
  exports: [ExplorerService],
})
export class ExplorerModule {}
