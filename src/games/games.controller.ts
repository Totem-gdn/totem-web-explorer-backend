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
  Put,
  Delete,
  Query,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { Web3AuthGuard } from '../auth/guards/web3auth.guard';
import { CurrentUser } from '../auth/decorators/currentUser';
import { isMongoId } from 'class-validator';
import { ListGamesFilters } from './interfaces/listGamesFilters';
import { CreateGameResponse } from './interfaces/createGameResponse';
import { UpdateGameResponse } from './interfaces/updateGameResponse';
import { GameRecord, SmallGameRecord } from './interfaces/gameRecord';
import { CreateGameRequestDTO } from './dto/games.dto';
import { UpdateGameRequestDTO } from './dto/updateGameRequest.dto';
import { GamesService } from './games.service';
import { LegacyService } from '../legacy/legacy.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GameCreateEntity } from './entities/gameCreate.entity';
import { GameRecordDTO, SmallGameRecordDTO } from './entities/game.entity';
import { OperationsENUM } from './enums/operations.enum';

@ApiTags('Games')
@Controller()
export class GamesController {
  constructor(private readonly gamesService: GamesService, private readonly legacyService: LegacyService) {}

  @Post()
  @UseGuards(new Web3AuthGuard(false))
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({
    status: 200,
    type: GameCreateEntity,
  })
  @ApiOperation({ summary: 'Create Game' })
  async create(@CurrentUser() user: string, @Body() createGameDto: CreateGameRequestDTO): Promise<CreateGameResponse> {
    createGameDto.owner = user;
    return await this.gamesService.create(createGameDto);
  }

  @Put(':id')
  @UseGuards(new Web3AuthGuard(false))
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({
    status: 200,
    type: GameCreateEntity,
  })
  @ApiOperation({ summary: 'Update Game' })
  async updateGame(
    @CurrentUser() user: string,
    @Body() updateGameDTO: UpdateGameRequestDTO,
    @Param('id') id: string,
  ): Promise<UpdateGameResponse> {
    if (!isMongoId(id)) {
      throw new BadRequestException('invalid id');
    }
    const game = await this.gamesService.findOneByIdAndOwner(id, user);
    if (!game) {
      throw new NotFoundException();
    }
    return await this.gamesService.update(game, updateGameDTO);
  }

  @Get()
  @UseGuards(new Web3AuthGuard(true))
  @ApiOperation({ summary: 'List of Game' })
  @ApiResponse({
    status: 200,
    type: GameRecordDTO,
    isArray: true,
  })
  async find(
    @CurrentUser() user: string,
    @Query('list', new DefaultValuePipe('latest')) list: 'latest' | 'popular' | 'random',
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('approved', new DefaultValuePipe(true), ParseBoolPipe) approved: boolean,
    @Query('hidden', new DefaultValuePipe(false), ParseBoolPipe) hidden: boolean,
    @Query('owner', new DefaultValuePipe('')) owner: string,
  ): Promise<GameRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }
    if (list === 'random') {
      return await this.gamesService.random(user);
    } else {
      // approved = approved.toString() !== 'false';
      const filters: ListGamesFilters = { list, page, search, approved, owner, hidden };
      if (user) {
        filters.user = user;
      }
      return await this.gamesService.find(filters);
    }
  }

  @Get('favorites')
  @UseGuards(new Web3AuthGuard(false))
  @ApiOperation({ summary: 'List of favorites games for user' })
  @ApiResponse({
    status: 200,
    type: GameRecordDTO,
    isArray: true,
  })
  async favorites(
    @CurrentUser() user: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<GameRecord[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }

    return await this.gamesService.favorites(user, page);
  }

  @Get('search')
  @UseGuards(new Web3AuthGuard(true))
  @ApiOperation({ summary: 'Small list of games for search' })
  @ApiResponse({
    status: 200,
    type: SmallGameRecordDTO,
    isArray: true,
  })
  async search(
    @CurrentUser() user: string,
    @Query('name', new DefaultValuePipe('')) name: string,
  ): Promise<SmallGameRecord[]> {
    return await this.gamesService.search(name);
  }

  @Get(':id')
  @UseGuards(new Web3AuthGuard(true))
  @ApiOperation({ summary: 'Information of specific game' })
  @ApiResponse({
    status: 200,
    type: GameRecordDTO,
  })
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
  @ApiOperation({ summary: 'API for update approve/reject/like/dislike/played statuses' })
  @ApiResponse({
    status: 200,
  })
  @ApiQuery({
    name: 'operation',
    required: true,
    enum: OperationsENUM,
  })
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

  @Delete(':id')
  @UseGuards(new Web3AuthGuard(false))
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Delete the game' })
  @ApiResponse({
    status: 200,
  })
  async delete(@CurrentUser() user: string, @Param('id') id: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('invalid id');
    }
    const game = await this.gamesService.findOneByIdAndOwner(id, user);
    if (!game) {
      throw new NotFoundException();
    }
    return await this.gamesService.delete(game);
  }
}
