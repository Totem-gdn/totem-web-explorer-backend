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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Web3AuthGuard } from '../../auth/guards/web3auth.guard';
import { CurrentUser } from '../../auth/decorators/currentUser';
import { isMongoId, isNumberString } from 'class-validator';
import { ListAvatarsFilters } from './interfaces/filters';
import { BaseAssetRecord } from '../common/interfaces/baseAssetRecord';
import { AvatarsService } from './avatars.service';
import { LegacyService } from '../../legacy/legacy.service';
import { LegacyTypes } from '../../legacy/legacy.constants';

@Controller()
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService, private readonly legacyService: LegacyService) {}

  @Get()
  @UseGuards(new Web3AuthGuard(true))
  async find(
    @CurrentUser() user: string,
    @Query('list', new DefaultValuePipe('latest')) list: 'latest' | 'popular' | 'my',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('gameId', new DefaultValuePipe('')) gameId: string,
    @Query('search', new DefaultValuePipe('')) search: string,
  ): Promise<BaseAssetRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }
    const filters: ListAvatarsFilters = { list, page };
    if (list === 'my' && !user) {
      throw new UnauthorizedException();
    }
    if (user) {
      filters.user = user;
    }
    if (gameId) {
      filters.gameId = gameId;
    }
    if (search) {
      filters.search = search;
    }
    return await this.avatarsService.find(filters);
  }

  @Get(':id')
  @UseGuards(new Web3AuthGuard(true))
  async findOne(@CurrentUser() user: string, @Param('id') id: string): Promise<BaseAssetRecord> {
    if (!isMongoId(id) && !isNumberString(id)) {
      throw new BadRequestException('invalid id');
    }
    const item = await this.avatarsService.findOne(id, user);
    if (!item) {
      throw new NotFoundException();
    }
    return item;
  }

  @Patch(':id/:operation/:gameId?')
  @UseGuards(new Web3AuthGuard(false))
  async update(
    @CurrentUser() user: string,
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
        return await this.legacyService.likeAsset(user, id, LegacyTypes.AvatarLiked);
      case 'dislike':
        return await this.legacyService.dislikeAsset(user, id, LegacyTypes.AvatarLiked);
    }
    // game specific operations
    if (!isMongoId(gameId)) {
      throw new BadRequestException('invalid game id');
    }
    switch (operation) {
      case 'use':
        return await this.legacyService.useAssetInGame(user, id, gameId, LegacyTypes.AvatarUsed, data);
      case 'add':
        return await this.legacyService.addAssetToGame(user, id, gameId, LegacyTypes.AvatarAdded);
    }
    throw new BadRequestException('invalid operation');
  }
}
