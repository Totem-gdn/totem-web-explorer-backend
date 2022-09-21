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
import { AvatarsService } from './avatars.service';
import { LegacyService } from '../../legacy/legacy.service';
import { Web3authGuard } from '../../auth/web3auth.guard';
import { IAvatarRecord, IListAvatarsFilters } from './avatars.interface';
import { LegacyTypes } from '../../legacy/legacy.constants';

@Controller()
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService, private readonly legacyService: LegacyService) {}

  @Get()
  @UseGuards(new Web3authGuard(true))
  async find(
    @Req() request: Request,
    @Query('list', new DefaultValuePipe('latest')) list: 'latest' | 'popular' | 'my',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('gameId', new DefaultValuePipe('')) gameId: string,
  ): Promise<IAvatarRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }
    const filters: IListAvatarsFilters = { list, page };
    if (list === 'my' && !request['user']) {
      throw new UnauthorizedException();
    }
    if (request['user']) {
      filters.user = request['user'];
    }
    if (gameId) {
      filters.gameId = gameId;
    }
    return await this.avatarsService.find(filters);
  }

  @Get(':id')
  @UseGuards(new Web3authGuard(true))
  async findOne(@Req() request: Request, @Param('id') id: string): Promise<IAvatarRecord> {
    const item = await this.avatarsService.findOne(id, request['user']);
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
        return await this.legacyService.likeAsset(request['user'], id, LegacyTypes.AvatarLiked);
      case 'dislike':
        return await this.legacyService.dislikeAsset(request['user'], id, LegacyTypes.AvatarLiked);
    }
    // game specific operations
    if (!gameId) {
      throw new BadRequestException('invalid game id');
    }
    switch (operation) {
      case 'use':
        return await this.legacyService.useAssetInGame(request['user'], id, gameId, LegacyTypes.AvatarUsed, data);
      case 'add':
        return await this.legacyService.addAssetToGame(request['user'], id, gameId, LegacyTypes.AvatarAdded);
    }
    throw new BadRequestException('invalid operation');
  }
}
