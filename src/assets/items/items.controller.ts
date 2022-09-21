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
import { ItemsService } from './items.service';
import { LegacyService } from '../../legacy/legacy.service';
import { Web3authGuard } from '../../auth/web3auth.guard';
import { IItemRecord, IListItemsFilters } from './items.interface';
import { LegacyTypes } from '../../legacy/legacy.constants';

@Controller()
export class ItemsController {
  constructor(private readonly itemsService: ItemsService, private readonly legacyService: LegacyService) {}

  @Get()
  @UseGuards(new Web3authGuard(true))
  async find(
    @Req() request: Request,
    @Query('list', new DefaultValuePipe('latest')) list: 'latest' | 'popular' | 'my',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('gameId', new DefaultValuePipe('')) gameId: string,
  ): Promise<IItemRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }
    const filters: IListItemsFilters = { list, page };
    if (list === 'my' && !request['user']) {
      throw new UnauthorizedException();
    }
    if (request['user']) {
      filters.user = request['user'];
    }
    if (gameId) {
      filters.gameId = gameId;
    }
    return await this.itemsService.find(filters);
  }

  @Get(':id')
  @UseGuards(new Web3authGuard(true))
  async findOne(@Req() request: Request, @Param('id') id: string): Promise<IItemRecord> {
    const item = await this.itemsService.findOne(id, request['user']);
    if (!item) {
      throw new NotFoundException();
    }
    return item;
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
    if (!id) {
      throw new BadRequestException('invalid id');
    }
    switch (operation) {
      case 'like':
        return await this.legacyService.likeAsset(request['user'], id, LegacyTypes.ItemLiked);
      case 'dislike':
        return await this.legacyService.dislikeAsset(request['user'], id, LegacyTypes.ItemLiked);
    }
    // game specific operations
    if (!gameId) {
      throw new BadRequestException('invalid game id');
    }
    switch (operation) {
      case 'use':
        return await this.legacyService.useAssetInGame(request['user'], id, gameId, LegacyTypes.ItemUsed, data);
      case 'add':
        return await this.legacyService.addAssetToGame(request['user'], id, gameId, LegacyTypes.ItemAdded);
    }
    throw new BadRequestException('invalid operation');
  }
}
