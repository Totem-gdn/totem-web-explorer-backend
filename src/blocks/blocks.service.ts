import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PageBlockRecord } from './interfaces/pageBlockRecord';
import { PageBlocks, PageBlocksDocument } from './schemas/blocks';

@Injectable()
export class BlocksService {
  constructor(
    @InjectModel(PageBlocks.name)
    private readonly pageBlocksModel: Model<PageBlocksDocument>,
  ) {}

  async list(page: number): Promise<PageBlockRecord[]> {
    const result = await this.pageBlocksModel
      .find()
      .skip((page - 1) * 10)
      .limit(10);

    const blocks: PageBlockRecord[] = [];

    for (const item of result) {
      blocks.push(await this.toPageBlockRecord(item));
    }

    return blocks;
  }

  private async toPageBlockRecord(payload: PageBlocksDocument): Promise<PageBlockRecord> {
    return {
      id: payload._id,
      title: payload.title,
      type: payload.type,
      data: payload.data,
    };
  }
}
