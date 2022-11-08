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
import { Web3AuthGuard } from '../auth/guards/web3auth.guard';
import { CurrentUser } from '../auth/decorators/currentUser';
import { isMongoId, isNumberString } from 'class-validator';
import { ListAssetsFilter } from './interfaces/filters';
import { AssetRecord } from './common/interfaces/assetRecord';
import { AssetsService } from './assets.service';
import { LegacyService } from '../legacy/legacy.service';
import { AssetType } from './types/assets';

@Controller()
export class AssetsController {
  constructor(private readonly service: AssetsService, private readonly legacyService: LegacyService) {}

  @Get(':assetType')
  @UseGuards(new Web3AuthGuard(true))
  async find(
    @CurrentUser() user: string,
    @Param('assetType') assetType: AssetType,
    @Query('list', new DefaultValuePipe('latest')) list: 'latest' | 'popular' | 'my',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('gameId', new DefaultValuePipe('')) gameId: string,
    @Query('search', new DefaultValuePipe('')) search: string,
  ): Promise<AssetRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }
    const filters: ListAssetsFilter = { list, page };
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
    return await this.service.find(assetType, filters);
  }

  @Get(':assetType/:id')
  @UseGuards(new Web3AuthGuard(true))
  async findOne(
    @CurrentUser() user: string,
    @Param('assetType') assetType: AssetType,
    @Param('id') id: string,
  ): Promise<AssetRecord> {
    if (!isMongoId(id) && !isNumberString(id)) {
      throw new BadRequestException('invalid id');
    }
    const item = await this.service.findOne(assetType, id, user);
    if (!item) {
      throw new NotFoundException();
    }
    return item;
  }

  @Get(':assetType/:id/ownership-history')
  @UseGuards(new Web3AuthGuard(true))
  async get(
    @CurrentUser() user: string,
    @Param('assetType') assetType: AssetType,
    @Param('id') id: string,
  ): Promise<any> {
    return await this.service.ownershipHistory(assetType, id);
  }

  @Patch(':assetType/:id/:operation/:gameId?')
  @UseGuards(new Web3AuthGuard(false))
  async update(
    @CurrentUser() user: string,
    @Param('assetType') assetType: AssetType,
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
        return await this.legacyService.likeAsset(assetType, user, id);
      case 'dislike':
        return await this.legacyService.dislikeAsset(assetType, user, id);
    }
    // game specific operations
    if (!isMongoId(gameId)) {
      throw new BadRequestException('invalid game id');
    }
    switch (operation) {
      case 'use':
        return await this.legacyService.useAssetInGame(assetType, user, id, gameId, data);
      case 'add':
        return await this.legacyService.addAssetToGame(assetType, user, id, gameId);
    }
    throw new BadRequestException('invalid operation');
  }
}
