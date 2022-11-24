import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MessageRecord } from './interfaces/messageRecord';
import { Messages, MessagesDocument } from './schemas/messages';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Messages.name)
    private readonly messageModel: Model<MessagesDocument>,
  ) {}

  async list(page: number): Promise<MessageRecord[]> {
    const result = await this.messageModel
      .find()
      .skip((page - 1) * 10)
      .limit(10);

    const blocks: MessageRecord[] = [];

    for (const item of result) {
      blocks.push(await this.toMessageRecord(item));
    }

    return blocks;
  }

  private async toMessageRecord(payload: MessagesDocument): Promise<MessageRecord> {
    return {
      id: payload._id,
      subject: payload.subject,
      type: payload.type,
      date: payload.date,
      message: payload.message,
    };
  }
}
