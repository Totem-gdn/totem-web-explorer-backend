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
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { isMongoId } from 'class-validator';
import { GamesService } from './games.service';
import { CreateGameRequestDto } from './games.dto';
import { ICreateGameResponse, IGameRecord, IListGamesFilters } from './games.interfaces';
import { Web3authGuard } from '../auth/web3auth.guard';
import { LegacyService } from '../legacy/legacy.service';

@Controller()
export class GamesController {
  constructor(private readonly gamesService: GamesService, private readonly legacyService: LegacyService) {}

  @Post()
  @UseGuards(new Web3authGuard(false))
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Req() request: Request, @Body() createGameDto: CreateGameRequestDto): Promise<ICreateGameResponse> {
    createGameDto.owner = request['user'];
    return await this.gamesService.create(createGameDto);
  }

  @Get()
  @UseGuards(new Web3authGuard(true))
  async find(
    @Req() request: Request,
    @Query('list', new DefaultValuePipe('latest')) list: 'latest' | 'popular' | 'random',
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<IGameRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }
    if (list === 'random') {
      return await this.gamesService.random(request['user']);
    } else {
      const filters: IListGamesFilters = { list, page, search };
      if (request['user']) {
        filters.user = request['user'];
      }
      return await this.gamesService.find(filters);
    }
  }

  @Get(':id')
  @UseGuards(new Web3authGuard(true))
  async findOne(@Req() request: Request, @Param('id') id: string): Promise<IGameRecord> {
    if (!isMongoId(id)) {
      throw new BadRequestException('invalid id');
    }
    const game = await this.gamesService.findOne(id, request['user']);
    if (!game) {
      throw new NotFoundException();
    }
    return game;
  }

  @Patch(':id/:operation')
  @UseGuards(new Web3authGuard(true))
  async update(@Req() request: Request, @Param('id') id: string, @Param('operation') operation: string): Promise<void> {
    if (!isMongoId(id)) {
      throw new BadRequestException('invalid id');
    }
    // no-authorization operations
    switch (operation) {
      case 'approve':
        return await this.gamesService.changeApprovance(id, true);
      case 'reject':
        return await this.gamesService.changeApprovance(id, false);
    }
    // authorization needed operations
    if (!request['user']) {
      throw new UnauthorizedException();
    }
    switch (operation) {
      case 'like':
        return await this.legacyService.likeGame(request['user'], id);
      case 'dislike':
        return await this.legacyService.dislikeGame(request['user'], id);
      case 'played':
        return await this.legacyService.gamePlayed(request['user'], id);
    }
    // invalid operation
    throw new BadRequestException('invalid operation');
  }
}
