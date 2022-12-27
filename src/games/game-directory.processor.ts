import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bull';
import { Model } from 'mongoose';
import { GameDirectoryEvent, GameDirectoryPayload } from 'src/config/queues/assets';
import { Game, GameDocument } from './schemas/games';

@Injectable()
@Processor('game-directory-queue')
export class GameDirectoryProcessor {
  private readonly logger = new Logger(GameDirectoryProcessor.name);

  constructor(@InjectModel(Game.name) private readonly gameModel: Model<GameDocument>) {}

  @Process(GameDirectoryEvent.Create)
  private async gameCreate(job: Job<GameDirectoryPayload>) {
    const game = await this.gameModel.findOne({ txHash: job.data.txHash }).exec();

    if (game) {
      game.set({ ...job.data });

      await game.save();
    }
  }

  @Process(GameDirectoryEvent.Update)
  private async gameUpdate(job: Job<GameDirectoryPayload>) {
    const game = await this.gameModel.findOne({ recordId: job.data.recordId }).exec();

    if (game) {
      game.set({ ...job.data });

      await game.save();
    }
  }
}
