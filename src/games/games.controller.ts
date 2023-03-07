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
import { constants, utils } from 'ethers';
import { Web3AuthGuard } from '../auth/guards/web3auth.guard';
import { CurrentUser } from '../auth/decorators/currentUser';
import { isMongoId } from 'class-validator';
import { ListGamesFilters } from './interfaces/listGamesFilters';
import { CreateGameResponse } from './interfaces/createGameResponse';
import { UpdateGameResponse } from './interfaces/updateGameResponse';
import { GameRecord, GameResponse, SmallGameRecord } from './interfaces/gameRecord';
import { CreateGameRequestDTO } from './dto/games.dto';
import { UpdateGameRequestDTO } from './dto/updateGameRequest.dto';
import { GamesService } from './games.service';
import { LegacyService } from '../legacy/legacy.service';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GameCreateEntity } from './entities/gameCreate.entity';
import { GameRecordDTO, SmallGameRecordDTO } from './entities/game.entity';
import { OperationsENUM } from './enums/operations.enum';
import { ApiPaginatedResponse, PaginatedDto } from 'src/utils/dto/paginated.dto';

@ApiTags('Games')
@ApiExtraModels(PaginatedDto)
@ApiExtraModels(GameRecordDTO)
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
  @ApiBadRequestResponse({ description: 'Game already exist in contract' })
  @ApiOperation({ summary: 'Create Game' })
  @ApiHeader({ name: 'Authorization', required: true, description: 'Authorization token' })
  async create(@CurrentUser() user: string, @Body() createGameDto: CreateGameRequestDTO): Promise<CreateGameResponse> {
    createGameDto.owner = user;
    return await this.gamesService.create(createGameDto);
  }

  @Put(':address')
  @UseGuards(new Web3AuthGuard(false))
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({
    status: 200,
    type: GameCreateEntity,
  })
  @ApiOperation({ summary: 'Update Game' })
  @ApiHeader({ name: 'Authorization', required: true, description: 'Authorization token' })
  @ApiNotFoundResponse({ description: 'Game not found ' })
  async updateGame(
    @CurrentUser() user: string,
    @Body() updateGameDTO: UpdateGameRequestDTO,
    @Param('address') address: string,
  ): Promise<UpdateGameResponse> {
    const game = await this.gamesService.findOneByAddressAndOwner(address, user);
    if (!game) {
      throw new NotFoundException();
    }
    return await this.gamesService.update(game, updateGameDTO);
  }

  @Get()
  @UseGuards(new Web3AuthGuard(true))
  @ApiOperation({ summary: 'List of Game' })
  @ApiHeader({ name: 'Authorization', required: false, description: 'Authorization token' })
  @ApiPaginatedResponse(GameRecordDTO, {
    description: 'Paginated list of the game records with query filters',
  })
  async find(
    @CurrentUser() user: string,
    @Query('list', new DefaultValuePipe('latest')) list: 'latest' | 'popular' | 'random',
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('approved', new DefaultValuePipe(true), ParseBoolPipe) approved: boolean,
    @Query('hidden', new DefaultValuePipe('')) hidden: '' | 'true' | 'false',
    @Query('owner', new DefaultValuePipe('')) owner: string,
  ): Promise<GameResponse> {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }
    if (list === 'random') {
      return await this.gamesService.random(user);
    } else {
      let isHidden;
      if (hidden === 'true' || hidden === 'false') {
        isHidden = hidden === 'true';
      }

      // approved = approved.toString() !== 'false';
      const filters: ListGamesFilters = { list, page, search, approved, owner, hidden: isHidden };
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
  @ApiHeader({ name: 'Authorization', required: true, description: 'Authorization token' })
  async favorites(
    @CurrentUser() user: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<GameResponse> {
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
  @ApiHeader({ name: 'Authorization', required: false, description: 'Authorization token' })
  async search(
    @CurrentUser() user: string,
    @Query('name', new DefaultValuePipe('')) name: string,
  ): Promise<SmallGameRecord[]> {
    return await this.gamesService.search(name);
  }

  @Get(':address')
  @UseGuards(new Web3AuthGuard(true))
  @ApiOperation({ summary: 'Information of specific game' })
  @ApiResponse({
    status: 200,
    type: GameRecordDTO,
  })
  @ApiHeader({ name: 'Authorization', required: false, description: 'Authorization token' })
  async findOne(@CurrentUser() user: string, @Param('address') address: string): Promise<GameRecord> {
    if (!utils.isAddress(address) || address === constants.AddressZero) {
      throw new BadRequestException('invalid game address');
    }
    const game = await this.gamesService.findOne(address, user);
    if (!game) {
      throw new NotFoundException();
    }
    return game;
  }

  @Patch(':address/:operation')
  @UseGuards(new Web3AuthGuard(true))
  @ApiOperation({ summary: 'API for update approve/reject/like/dislike/played statuses' })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated',
  })
  @ApiQuery({
    name: 'operation',
    required: true,
    enum: OperationsENUM,
  })
  @ApiHeader({ name: 'Authorization', required: false, description: 'Authorization token' })
  @ApiNotFoundResponse({ description: 'Game not found ' })
  @ApiForbiddenResponse({ description: 'JWT token expired or not found' })
  @ApiBadRequestResponse({ description: 'Invalid operation' })
  async update(
    @CurrentUser() user: string,
    @Param('address') address: string,
    @Param('operation') operation: string,
  ): Promise<void> {
    if (!utils.isAddress(address) || address === constants.AddressZero) {
      throw new BadRequestException('invalid game address');
    }
    const gameId = await this.gamesService.getGameIdByAddress(address);
    if (!gameId) {
      throw new NotFoundException();
    }
    // no-authorization operations
    switch (operation) {
      case 'approve':
        return await this.gamesService.changeApprovance(address, true);
      case 'reject':
        return await this.gamesService.changeApprovance(address, false);
    }
    // authorization needed operations
    if (!user) {
      throw new UnauthorizedException();
    }
    switch (operation) {
      case 'like':
        return await this.legacyService.likeGame(user, gameId);
      case 'dislike':
        return await this.legacyService.dislikeGame(user, gameId);
      case 'played':
        return await this.legacyService.gamePlayed(user, gameId);
    }
    // invalid operation
    throw new BadRequestException('invalid operation');
  }

  @Delete(':address')
  @UseGuards(new Web3AuthGuard(false))
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Delete the game' })
  @ApiResponse({
    status: 200,
  })
  @ApiHeader({ name: 'Authorization', required: true, description: 'Authorization token' })
  @ApiBadRequestResponse({ description: 'Invalid game address' })
  @ApiNotFoundResponse({ description: 'Game not found' })
  async delete(@CurrentUser() user: string, @Param('address') address: string) {
    if (!utils.isAddress(address) || address === constants.AddressZero) {
      throw new BadRequestException('invalid game address');
    }
    const game = await this.gamesService.findOneByAddressAndOwner(address, user);
    if (!game) {
      throw new NotFoundException();
    }
    return await this.gamesService.delete(game);
  }
}
