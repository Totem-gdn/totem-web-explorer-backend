import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Messages, MessagesSchema } from './schemas/messages';
import { MessagesLegacy, MessagesLegacySchema } from './schemas/messagesLegacy';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: Messages.name,
        schema: MessagesSchema,
      },
      {
        name: MessagesLegacy.name,
        schema: MessagesLegacySchema,
      },
    ]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
