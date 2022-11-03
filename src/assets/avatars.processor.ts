import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AssetEvent, AssetPayload, AssetQueue } from '../config/queues/assets';
import { LegacyService } from '../legacy/legacy.service';
import { ExplorerService } from '../explorer/explorer.service';
import { Avatar, AvatarDocument } from './schemas/avatars';
import { AssetsOwnershipHistory, AssetsOwnershipHistoryDocument } from './schemas/assetsOwnershipHistory';

@Injectable()
@Processor(AssetQueue.Avatars)
export class AvatarsProcessor {
  private readonly logger = new Logger(AvatarsProcessor.name);

  constructor(
    private readonly config: ConfigService,
    private readonly legacyService: LegacyService,
    private readonly explorerService: ExplorerService,
    @InjectQueue(AssetQueue.Avatars) private readonly avatarsQueue: Queue<AssetPayload>,
    @InjectModel(Avatar.name) private readonly avatarModel: Model<AvatarDocument>,
    @InjectModel(AssetsOwnershipHistory.name) private readonly ownershipModel: Model<AssetsOwnershipHistoryDocument>,
  ) {}

  @Process(AssetEvent.Create)
  private async createAsset(job: Job<AssetPayload>) {
    this.logger.log(`create asset ${job.data.assetType}::${job.id}`);
    // const dna = await this.explorerService.getAssetDNA(job.data.assetType, job.data.tokenId);
    await this.avatarModel.create({
      tokenId: job.data.tokenId,
      owner: job.data.to,
      owners: [job.data.to],
      views: 0,
      // dna,
    });
    await this.ownershipModel.create({
      from: '0',
      to: job.data.to,
      tokenId: job.data.tokenId,
      tokenType: job.data.assetType,
      hash: job.data.transactionHash,
      price: 0,
    });
  }

  @Process(AssetEvent.Transfer)
  private async transferAsset(job: Job<AssetPayload>) {
    this.logger.log(`transfer asset ${job.data.assetType}::${job.id}`);
    await this.avatarModel.findOneAndUpdate(
      { tokenId: job.data.tokenId },
      {
        $set: { owner: job.data.to },
        $push: { owners: job.data.from },
      },
    );
    await this.ownershipModel.create({
      from: job.data.from,
      to: job.data.to,
      tokenId: job.data.tokenId,
      tokenType: job.data.assetType,
      hash: job.data.transactionHash,
      price: '0',
    });
  }
}
