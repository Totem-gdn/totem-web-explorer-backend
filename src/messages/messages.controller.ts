import {
  Controller,
  DefaultValuePipe,
  Get,
  UseGuards,
  Query,
  ParseIntPipe,
  BadRequestException,
  Patch,
  Param,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CurrentUser } from '../auth/decorators/currentUser';
import { Web3AuthGuard } from '../auth/guards/web3auth.guard';
import { MessageRecord } from './interfaces/messageRecord';
import { isMongoId } from 'class-validator';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MessageEntity } from './entities/message.entity';
import { MessagesEvents } from './enums/legacy.enums';

@ApiTags('Messages')
@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @UseGuards(new Web3AuthGuard(true))
  @ApiResponse({
    status: 200,
    description: 'Message records list',
    type: MessageEntity,
  })
  @ApiOperation({ summary: 'Get messages list' })
  @ApiHeader({ name: 'Authorization', required: true, description: 'Authorization token' })
  async list(
    @CurrentUser() user: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<MessageRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }

    return await this.messagesService.list(page, user);
  }

  @Patch(':id/:operation')
  @UseGuards(new Web3AuthGuard(false))
  @ApiQuery({
    name: 'operation',
    required: true,
    enum: MessagesEvents,
  })
  @ApiResponse({
    status: 200,
  })
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiHeader({ name: 'Authorization', required: true, description: 'Authorization token' })
  async update(@CurrentUser() user: string, @Param('id') id: string, @Param('operation') operation: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('invalid id');
    }

    switch (operation) {
      case 'read':
        return await this.messagesService.read(id, user);
    }
  }
}
