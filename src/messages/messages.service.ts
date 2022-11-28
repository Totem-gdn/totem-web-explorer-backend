import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MessageRecord } from './interfaces/messageRecord';
import { Messages, MessagesDocument, MessageAggregationDocument } from './schemas/messages';
import { MessagesLegacy, MessagesLegacyDocument } from './schemas/messagesLegacy';
import { MessagesEvents } from './enums/legacy.enums';

@Injectable()
export class MessagesService {
  private readonly perPage: number = 10;
  constructor(
    @InjectModel(Messages.name)
    private readonly messageModel: Model<MessagesDocument>,
    @InjectModel(MessagesLegacy.name)
    private readonly messageLegacyModel: Model<MessagesLegacyDocument>,
  ) {}

  async list(page: number, user: string): Promise<MessageRecord[]> {
    const now = new Date().getTime();

    const result = await this.messageModel
      .aggregate<MessageAggregationDocument>([
        { $match: { date: { $lte: now.toString() } } },
        { $skip: (page - 1) * this.perPage },
        { $limit: this.perPage },
        this.legacyLookupPipeline('isRead', [{ $match: { type: MessagesEvents.Read, user } }]),
        {
          $addFields: {
            isRead: { $gt: [{ $size: '$isRead' }, 0] },
          },
        },
      ])
      .exec();

    const blocks: MessageRecord[] = [];

    for (const item of result) {
      blocks.push(await this.toMessageRecord(item));
    }

    return blocks;
  }

  async read(message: string, user: string): Promise<void> {
    const record = await this.messageLegacyModel.findOne({ user, message, type: MessagesEvents.Read }).exec();
    if (!record) {
      await this.messageLegacyModel.create({ user, message, type: MessagesEvents.Read });
    }
  }

  private legacyLookupPipeline(as: string, pipeline: any[]) {
    return {
      $lookup: {
        from: 'messagesLegacy',
        localField: '_id',
        foreignField: 'message',
        pipeline,
        as,
      },
    };
  }

  private async toMessageRecord(payload: MessageAggregationDocument): Promise<MessageRecord> {
    return {
      id: payload._id,
      subject: payload.subject,
      type: payload.type,
      date: payload.date,
      message: payload.message,
      isRead: payload.isRead,
    };
  }
}
