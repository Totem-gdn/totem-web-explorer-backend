import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PageBlockRecord } from './interfaces/pageBlockRecord';
import { PageBlocks, PageBlocksDocument } from './schemas/blocks';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BlocksService {
  private readonly staticEndpoint: URL;
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(PageBlocks.name)
    private readonly pageBlocksModel: Model<PageBlocksDocument>,
  ) {
    this.staticEndpoint = new URL(this.configService.get<string>('aws.s3.endpoint'));
  }

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

  private async toPageBlockRecord(payload): Promise<PageBlockRecord> {
    const data = payload.data;
    if (data.image) {
      data.image = await this.getStaticUrl(payload._id.toString(), data.image);
    }
    return {
      id: payload._id,
      title: payload.title,
      type: payload.type,
      data: payload.data,
    };
  }

  private async getStaticUrl(blockId: string, { filename, mimeType, contentLength }): Promise<string> {
    const url = new URL(this.staticEndpoint);
    url.pathname = join(blockId, filename);
    return url.toString();
  }
}
