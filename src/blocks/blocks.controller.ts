import { Controller, DefaultValuePipe, Get, UseGuards, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { Web3AuthGuard } from '../auth/guards/web3auth.guard';
import { PageBlockRecord } from './interfaces/pageBlockRecord';
import { PageBlockEntity } from './entities/pageBlock.entity';

@ApiTags('Pages')
@Controller()
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  @UseGuards(new Web3AuthGuard(true))
  @ApiResponse({
    status: 200,
    description: 'Page blocks list',
    type: PageBlockEntity,
  })
  @ApiOperation({ summary: 'Get list of blocks of home page' })
  async list(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number): Promise<PageBlockRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }

    return await this.blocksService.list(page);
  }
}
