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
  private readonly prefix: string;
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(PageBlocks.name)
    private readonly pageBlocksModel: Model<PageBlocksDocument>,
  ) {
    this.staticEndpoint = new URL(this.configService.get<string>('aws.s3.endpoint'));
    this.prefix = this.configService.get<string>('aws.s3.prefix');
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
    const date = new Date(payload.updated_at ? payload.updated_at : payload.createdAt);
    const data = payload.data;
    if (data.image) {
      data.image = await this.getStaticUrl(payload._id.toString(), data.image, date.getTime());
    }
    return {
      id: payload._id,
      title: payload.title,
      type: payload.type,
      data: payload.data,
      updatedAt: payload.updated_at,
    };
  }

  private async getStaticUrl(blockId: string, { filename, mimeType, contentLength }, timestamp): Promise<string> {
    const url = new URL(this.staticEndpoint);
    url.pathname = join(blockId, filename);
    url.searchParams.set('t', timestamp);
    return url.toString();
  }
}
