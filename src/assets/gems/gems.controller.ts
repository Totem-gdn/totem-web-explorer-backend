import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { GemsService } from './gems.service';
import { LegacyService } from '../../legacy/legacy.service';
import { Web3authGuard } from '../../auth/web3auth.guard';
import { IGemRecord, IListGemsFilters } from './gems.interface';
import { LegacyTypes } from '../../legacy/legacy.constants';
import { isMongoId } from 'class-validator';

@Controller()
export class GemsController {
  constructor(private readonly gemsService: GemsService, private readonly legacyService: LegacyService) {}

  @Get()
  @UseGuards(new Web3authGuard(true))
  async find(
    @Req() request: Request,
    @Query('list', new DefaultValuePipe('latest')) list: 'latest' | 'popular' | 'my',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('gameId', new DefaultValuePipe('')) gameId: string,
  ): Promise<IGemRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }
    const filters: IListGemsFilters = { list, page };
    if (list === 'my' && !request['user']) {
      throw new UnauthorizedException();
    }
    if (request['user']) {
      filters.user = request['user'];
    }
    if (gameId) {
      filters.gameId = gameId;
    }
    return await this.gemsService.find(filters);
  }

  @Get(':id')
  @UseGuards(new Web3authGuard(true))
  async findOne(@Req() request: Request, @Param('id') id: string): Promise<IGemRecord> {
    if (!isMongoId(id)) {
      throw new BadRequestException('invalid id');
    }
    const gem = await this.gemsService.findOne(id, request['user']);
    if (!gem) {
      throw new NotFoundException();
    }
    return gem;
  }

  @Patch(':id/:operation/:gameId?')
  @UseGuards(new Web3authGuard(false))
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('operation') operation: string,
    @Param('gameId', new DefaultValuePipe('')) gameId: string,
    @Body('data', new DefaultValuePipe('')) data: string,
  ): Promise<void> {
    if (!isMongoId(id)) {
      throw new BadRequestException('invalid id');
    }
    switch (operation) {
      case 'like':
        return await this.legacyService.likeAsset(request['user'], id, LegacyTypes.GemLiked);
      case 'dislike':
        return await this.legacyService.dislikeAsset(request['user'], id, LegacyTypes.GemLiked);
    }
    // game specific operations
    if (!isMongoId(gameId)) {
      throw new BadRequestException('invalid game id');
    }
    switch (operation) {
      case 'use':
        return await this.legacyService.useAssetInGame(request['user'], id, gameId, LegacyTypes.GemUsed, data);
      case 'add':
        return await this.legacyService.addAssetToGame(request['user'], id, gameId, LegacyTypes.GemAdded);
    }
    throw new BadRequestException('invalid operation');
  }
}
