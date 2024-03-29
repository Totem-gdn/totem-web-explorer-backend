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
  Response,
  Post,
} from '@nestjs/common';
import { Web3AuthGuard } from '../auth/guards/web3auth.guard';
import { CurrentUser } from '../auth/decorators/currentUser';
import { isMongoId, isNumberString } from 'class-validator';
import { ListAssetsFilter } from './interfaces/filters';
import { AssetRecord, AssetResponse } from './common/interfaces/assetRecord';
import { AssetsService } from './assets.service';
import { LegacyService } from '../legacy/legacy.service';
import { AssetType } from './types/assets';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AssetEntity } from './entities/asset.entity';
import { AssetsTypes } from './enums/assetsTypes.enum';
import { OwnerShip } from './enums/ownershipTypes.enum';
import { AssetOperationTypes } from './enums/operationsTypes.enum';
import { ApiPaginatedResponse, PaginatedDto } from '../utils/dto/paginated.dto';

@ApiTags('Assets')
@ApiExtraModels(PaginatedDto)
@Controller()
export class AssetsController {
  constructor(private readonly service: AssetsService, private readonly legacyService: LegacyService) {}

  @Get(':assetType')
  @UseGuards(new Web3AuthGuard(true))
  @ApiQuery({
    name: 'assetType',
    required: true,
    enum: AssetsTypes,
  })
  @ApiPaginatedResponse(AssetEntity, {
    description: 'Paginated list of the asset legacy records with query filters',
  })
  @ApiOperation({ summary: 'Assets records list' })
  async find(
    @CurrentUser() user: string,
    @Param('assetType') assetType: AssetType,
    @Query('list', new DefaultValuePipe('latest')) list: 'latest' | 'popular' | 'my',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('gameId', new DefaultValuePipe('')) gameId: string,
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('owner', new DefaultValuePipe('')) owner: string,
  ): Promise<AssetResponse> {
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
    if (owner) {
      filters.owner = owner;
    }
    return await this.service.find(assetType, filters);
  }

  @Get('user/:address/:assetType')
  @UseGuards(new Web3AuthGuard(true))
  @ApiPaginatedResponse(AssetEntity, {
    description: 'Paginated list of the asset legacy records with query filters for specific user',
  })
  @ApiQuery({
    name: 'assetType',
    required: true,
    enum: AssetsTypes,
  })
  @ApiQuery({
    name: 'user address',
    required: true,
    type: String,
  })
  @ApiOperation({ summary: 'Assets list by user address' })
  async getAssetsByUserAddress(
    @CurrentUser() user: string,
    @Param('assetType') assetType: AssetType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    console.log(user, assetType, page);
    return await this.service.getAssetsByUserAddress(assetType, user, page);
  }

  @Get('favorites/:assetType')
  @UseGuards(new Web3AuthGuard(false))
  @ApiPaginatedResponse(AssetEntity, {
    description: 'Paginated list of the favorites asset legacy records with query filters',
  })
  @ApiQuery({
    name: 'assetType',
    required: true,
    enum: AssetsTypes,
  })
  @ApiBadRequestResponse({ description: 'Invalid page number' })
  @ApiOperation({ summary: 'Favorites assets list' })
  async getFavorites(
    @CurrentUser() user: string,
    @Param('assetType') assetType: AssetType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    if (page < 1) {
      throw new BadRequestException('invalid page number');
    }

    const result = await this.service.getFavorites(assetType, user, page);

    return result;
  }

  @Get(':assetType/:id')
  @UseGuards(new Web3AuthGuard(true))
  @ApiResponse({
    status: 200,
    description: 'Asset entity',
    type: AssetEntity,
  })
  @ApiQuery({
    name: 'assetType',
    required: true,
    enum: AssetsTypes,
  })
  @ApiOperation({ summary: 'Get asset entity by id' })
  @ApiNotFoundResponse({ description: 'Asset not found' })
  @ApiBadRequestResponse({ description: 'Invalid ID' })
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

  @Get(':assetType/:id/:operation')
  @ApiResponse({
    status: 200,
    description: 'Legacy or ownership history',
  })
  @ApiQuery({
    name: 'assetType',
    required: true,
    enum: AssetsTypes,
  })
  @ApiQuery({
    name: 'operation',
    required: true,
    enum: OwnerShip,
  })
  @ApiOperation({ summary: 'Get asset ownership history or legacy history' })
  @UseGuards(new Web3AuthGuard(true))
  async get(
    @CurrentUser() user: string,
    @Param('assetType') assetType: AssetType,
    @Param('id') id: string,
    @Param('operation') operation: string,
  ): Promise<any> {
    switch (operation) {
      case 'ownership-history':
        return await this.service.ownershipHistory(assetType, id);
      case 'legacy-history':
        return await this.service.legacyHistory(assetType, id);
    }
  }

  @Patch(':assetType/:id/:operation/:gameId?')
  @UseGuards(new Web3AuthGuard(false))
  @ApiResponse({
    status: 200,
    description: 'Updated successfully',
  })
  @ApiQuery({
    name: 'assetType',
    required: true,
    enum: AssetsTypes,
  })
  @ApiQuery({
    name: 'operation',
    required: true,
    enum: AssetOperationTypes,
  })
  @ApiOperation({ summary: 'update asset' })
  @ApiBadRequestResponse({ description: 'Invalid ID' })
  @ApiUnauthorizedResponse({ description: 'JWT token expired' })
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
    if (!user) {
      throw new UnauthorizedException();
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
