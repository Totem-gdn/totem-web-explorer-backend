import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AssetEvent, AssetPayload, AssetQueue } from '../config/queues/assets';
import { LegacyService } from '../legacy/legacy.service';
import { ExplorerService } from '../explorer/explorer.service';
import { Item, ItemDocument } from './schemas/items';

@Injectable()
@Processor(AssetQueue.Items)
export class ItemsProcessor {
  private readonly logger = new Logger(ItemsProcessor.name);

  constructor(
    private readonly config: ConfigService,
    private readonly legacyService: LegacyService,
    private readonly explorerService: ExplorerService,
    @InjectQueue(AssetQueue.Items) private readonly itemsQueue: Queue<AssetPayload>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
  ) {}

  @Process(AssetEvent.Create)
  private async createAsset(job: Job<AssetPayload>) {
    this.logger.log(`create asset ${job.data.assetType}::${job.id}`);
    // const dna = await this.explorerService.getAssetDNA(job.data.assetType, job.data.tokenId);
    await this.itemModel.create({
      tokenId: job.data.tokenId,
      owner: job.data.to,
      owners: [job.data.to],
      views: 0,
      // dna,
    });
  }

  @Process(AssetEvent.Transfer)
  private async transferAsset(job: Job<AssetPayload>) {
    this.logger.log(`transfer asset ${job.data.assetType}::${job.id}`);
    await this.itemModel.findOneAndUpdate(
      { tokenId: job.data.tokenId },
      {
        $set: { owner: job.data.to },
        $push: { owners: job.data.from },
      },
    );
  }
}
