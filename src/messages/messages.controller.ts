import { Controller, DefaultValuePipe, Get, UseGuards, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Web3AuthGuard } from '../auth/guards/web3auth.guard';
import { MessageRecord } from './interfaces/messageRecord';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @UseGuards(new Web3AuthGuard(true))
  async list(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number): Promise<MessageRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }

    return await this.messagesService.list(page);
  }
}
