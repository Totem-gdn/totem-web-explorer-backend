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
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Web3AuthGuard } from '../auth/guards/web3auth.guard';
import { CurrentUser } from '../auth/decorators/currentUser';
import { isMongoId } from 'class-validator';
import { ListGamesFilters } from './interfaces/listGamesFilters';
import { CreateGameResponse } from './interfaces/createGameResponse';
import { GameRecord } from './interfaces/gameRecord';
import { CreateGameRequestDto } from './dto/games.dto';
import { GamesService } from './games.service';
import { LegacyService } from '../legacy/legacy.service';

@Controller()
export class GamesController {
  constructor(private readonly gamesService: GamesService, private readonly legacyService: LegacyService) {}

  @Post()
  @UseGuards(new Web3AuthGuard(false))
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@CurrentUser() user: string, @Body() createGameDto: CreateGameRequestDto): Promise<CreateGameResponse> {
    createGameDto.owner = user;
    return await this.gamesService.create(createGameDto);
  }

  @Get()
  @UseGuards(new Web3AuthGuard(true))
  async find(
    @CurrentUser() user: string,
    @Query('list', new DefaultValuePipe('latest')) list: 'latest' | 'popular' | 'random',
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<GameRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }
    if (list === 'random') {
      return await this.gamesService.random(user);
    } else {
      const filters: ListGamesFilters = { list, page, search };
      if (user) {
        filters.user = user;
      }
      return await this.gamesService.find(filters);
    }
  }

  @Get(':id')
  @UseGuards(new Web3AuthGuard(true))
  async findOne(@CurrentUser() user: string, @Param('id') id: string): Promise<GameRecord> {
    if (!isMongoId(id)) {
      throw new BadRequestException('invalid id');
    }
    const game = await this.gamesService.findOne(id, user);
    if (!game) {
      throw new NotFoundException();
    }
    return game;
  }

  @Patch(':id/:operation')
  @UseGuards(new Web3AuthGuard(true))
  async update(
    @CurrentUser() user: string,
    @Param('id') id: string,
    @Param('operation') operation: string,
  ): Promise<void> {
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
    if (!user) {
      throw new UnauthorizedException();
    }
    switch (operation) {
      case 'like':
        return await this.legacyService.likeGame(user, id);
      case 'dislike':
        return await this.legacyService.dislikeGame(user, id);
      case 'played':
        return await this.legacyService.gamePlayed(user, id);
    }
    // invalid operation
    throw new BadRequestException('invalid operation');
  }
}