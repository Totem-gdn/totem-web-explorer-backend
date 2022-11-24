import { Controller, DefaultValuePipe, Get, UseGuards, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { Web3AuthGuard } from '../auth/guards/web3auth.guard';
import { PageBlockRecord } from './interfaces/pageBlockRecord';

@Controller()
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  @UseGuards(new Web3AuthGuard(true))
  async list(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number): Promise<PageBlockRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }

    return await this.blocksService.list(page);
  }
}
