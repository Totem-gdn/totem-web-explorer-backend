import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { LegacyPayload, LegacyQueue } from '../config/queues/assets';
import { LegacyService } from '../legacy/legacy.service';
import { ExplorerService } from '../explorer/explorer.service';
import { Avatar, AvatarDocument } from './schemas/avatars';
import { AssetsOwnershipHistory, AssetsOwnershipHistoryDocument } from './schemas/assetsOwnershipHistory';
import { Item, ItemDocument } from './schemas/items';
import { Gem, GemDocument } from './schemas/gems';

@Injectable()
@Processor(LegacyQueue.Avatars)
export class AvatarsLegacyProcessor {
  private readonly logger = new Logger(AvatarsLegacyProcessor.name);

  constructor(
    @InjectModel(Avatar.name)
    private readonly avatarModel: Model<AvatarDocument>,
  ) {}

  @Process('asset-legacy-update')
  private async legacyUpdate(job: Job<LegacyPayload>) {
    const avatar = await this.avatarModel.findOneAndUpdate(
      { tokenId: job.data.tokenId },
      { legacyEventsAmount: job.data.legacyEventsAmount },
    );
  }
}

@Injectable()
@Processor(LegacyQueue.Gems)
export class GemsLegacyProcessor {
  constructor(
    @InjectModel(Gem.name)
    private readonly gemModel: Model<GemDocument>,
  ) {}

  @Process('asset-legacy-update')
  private async legacyUpdate(job: Job<LegacyPayload>) {
    await this.gemModel.findOneAndUpdate(
      { tokenId: job.data.tokenId },
      { legacyEventsAmount: job.data.legacyEventsAmount },
    );
  }
}

@Injectable()
@Processor(LegacyQueue.Items)
export class ItemsLegacyProcessor {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: Model<ItemDocument>,
  ) {}

  @Process('asset-legacy-update')
  private async legacyUpdate(job: Job<LegacyPayload>) {
    await this.itemModel.findOneAndUpdate(
      { tokenId: job.data.tokenId },
      { legacyEventsAmount: job.data.legacyEventsAmount },
    );
  }
}
