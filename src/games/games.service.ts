import { join } from 'path';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Model, Types } from 'mongoose';
import { Game, GameAggregationDocument, GameDocument } from './schemas/games';
import { ConfigService } from '@nestjs/config';
import { ListGamesFilters } from './interfaces/listGamesFilters';
import { LegacyEvents } from '../legacy/enums/legacy.enums';
import { GameImage } from './interfaces/gameImage';
import { GameRecord, GameResponse, SmallGameRecord } from './interfaces/gameRecord';
import { CreateGameRequest } from './interfaces/createGameRequest';
import { UpdateGameRequest } from './interfaces/updateGameRequest';
import { CreateGameResponse } from './interfaces/createGameResponse';
import { UpdateGameResponse } from './interfaces/updateGameResponse';
import { LegacyService } from '../legacy/legacy.service';
import { gameDataForContract } from './interfaces/gameDataForContract';
import { catchError, lastValueFrom, map } from 'rxjs';

@Injectable()
export class GamesService {
  private readonly s3Client: S3Client;
  private readonly s3GDNClient: S3Client;
  private readonly bucket: string;
  private readonly bucketCore: string;
  private readonly staticEndpoint: URL;
  private readonly staticEndpointCore: URL;
  private readonly perPage: number = 10;
  private readonly gameDirectoryEndpoint: URL;

  constructor(
    private readonly configService: ConfigService,
    private readonly legacyService: LegacyService,
    private httpService: HttpService,
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
  ) {
    this.bucket = this.configService.get<string>('aws.s3.bucket');
    this.staticEndpoint = new URL(this.configService.get<string>('aws.s3.endpoint'));
    this.bucketCore = this.configService.get<string>('aws.s3.bucketCore');
    this.staticEndpointCore = new URL(this.configService.get<string>('aws.s3.endpointCore'));
    // this.staticEndpointCore = new URL(this.configService.get<string>('aws.s3.endpoint'));
    this.gameDirectoryEndpoint = new URL(this.configService.get<string>('provider.gameDirectory.endpoint'));
    this.s3Client = new S3Client({});
    this.s3GDNClient = new S3Client({ endpoint: this.staticEndpointCore.toString() });
  }

  async create(game: CreateGameRequest): Promise<CreateGameResponse> {
    if (game.connections.dnaFilters?.avatarFilter) {
      game.connections.dnaFilters.avatarFilter.filename = `${uuidv4()}-${
        game.connections.dnaFilters.avatarFilter.filename
      }`;
    }
    if (game.connections.dnaFilters?.assetFilter) {
      game.connections.dnaFilters.assetFilter.filename = `${uuidv4()}-${
        game.connections.dnaFilters.assetFilter.filename
      }`;
    }
    if (game.connections.dnaFilters?.gemFilter) {
      game.connections.dnaFilters.gemFilter.filename = `${uuidv4()}-${game.connections.dnaFilters.gemFilter.filename}`;
    }
    game.images.coverImage.filename = `${uuidv4()}-${game.images.coverImage.filename}`;
    game.images.cardThumbnail.filename = `${uuidv4()}-${game.images.cardThumbnail.filename}`;
    game.images.smallThumbnail.filename = `${uuidv4()}-${game.images.smallThumbnail.filename}`;
    for (const image of game.images.gallery) {
      image.filename = `${uuidv4()}-${image.filename}`;
    }

    delete game.hidden;

    const isExist = await this.gameModel.findOne({ 'general.name': game.general.name });

    if (isExist && isExist._id) {
      throw new BadRequestException('Game already exist');
    }

    const newGame = await this.gameModel.create(game);

    const dataForContract: gameDataForContract = {
      owner: game.owner,
      name: game.general.name,
      author: game.general.author,
      renderer: game.connections.assetRenderer ? game.connections.assetRenderer : '',
      avatarFilter:
        game.connections.dnaFilters &&
        game.connections.dnaFilters.avatarFilter &&
        game.connections.dnaFilters.avatarFilter.filename
          ? await this.getStaticUrl(newGame.id, game.connections.dnaFilters.avatarFilter, this.staticEndpointCore)
          : '',
      itemFilter:
        game.connections.dnaFilters &&
        game.connections.dnaFilters.assetFilter &&
        game.connections.dnaFilters.assetFilter.filename
          ? await this.getStaticUrl(newGame.id, game.connections.dnaFilters.assetFilter, this.staticEndpointCore)
          : '',
      gemFilter:
        game.connections.dnaFilters &&
        game.connections.dnaFilters.gemFilter &&
        game.connections.dnaFilters.gemFilter.filename
          ? await this.getStaticUrl(newGame.id, game.connections.dnaFilters.gemFilter, this.staticEndpointCore)
          : '',
      website: game.connections.webpage,
    };

    // try {
    //   const txHash = await this.createGameInContract(dataForContract);

    //   if (txHash) {
    //     newGame.set({ txHash });

    //     await newGame.save();
    //   }
    // } catch (e) {
    //   console.log('CREATE GAME IN CONTRACT ERROR');
    // }

    return {
      id: newGame.id,
      connections: {
        dnaFilters: {
          avatarFilter:
            game.connections.dnaFilters?.avatarFilter &&
            (await this.getPutSignedUrl(newGame.id, game.connections.dnaFilters.avatarFilter, 'core')),
          assetFilter:
            game.connections.dnaFilters?.assetFilter &&
            (await this.getPutSignedUrl(newGame.id, game.connections.dnaFilters.assetFilter, 'core')),
          gemFilter:
            game.connections.dnaFilters?.gemFilter &&
            (await this.getPutSignedUrl(newGame.id, game.connections.dnaFilters.gemFilter, 'core')),
        },
      },
      uploadImageURLs: {
        coverImage: await this.getPutSignedUrl(newGame.id, game.images.coverImage, 'explorer'),
        cardThumbnail: await this.getPutSignedUrl(newGame.id, game.images.cardThumbnail, 'explorer'),
        smallThumbnail: await this.getPutSignedUrl(newGame.id, game.images.smallThumbnail, 'explorer'),
        imagesGallery: await this.getPutSignedUrls(newGame.id, game.images.gallery, 'explorer'),
      },
    };
  }

  async update(gameDB: GameDocument, payload: UpdateGameRequest): Promise<UpdateGameResponse> {
    const game = gameDB.toJSON();
    const response: UpdateGameResponse = {
      id: game.id,
    };
    game.id = game._id.toString();

    // files part
    const filesToDelete = [];
    const coreFilesToDelete = [];
    if (payload.connections?.dnaFilters) {
      response.connections = { dnaFilters: {} };
      const dnaFilters = payload.connections.dnaFilters;
      for (const dnaFiltersKey in dnaFilters) {
        if (
          game.connections.dnaFilters &&
          game.connections.dnaFilters[dnaFiltersKey] &&
          game.connections.dnaFilters[dnaFiltersKey].filename
        ) {
          coreFilesToDelete.push({ Key: join(game.id, game.connections.dnaFilters[dnaFiltersKey].filename) });
        }

        if (payload.connections.dnaFilters[dnaFiltersKey] !== null) {
          payload.connections.dnaFilters[dnaFiltersKey].filename = `${uuidv4()}-${
            payload.connections.dnaFilters[dnaFiltersKey].filename
          }`;
          response.connections.dnaFilters[dnaFiltersKey] = await this.getPutSignedUrl(
            game.id,
            payload.connections.dnaFilters[dnaFiltersKey],
            'core',
          );
        }
        const filters = { ...game.connections.dnaFilters, ...payload.connections.dnaFilters };
        const connections = { ...payload.connections, dnaFilters: filters };
        payload.connections = connections;
      }
    }

    if (payload.connections) {
      payload.connections = { ...game.connections, ...payload.connections };
    }

    if (payload.images) {
      response.uploadImageURLs = {};
      const { gallery: _gallery, ...payloadImages } = payload.images;
      payload.images = { ...game.images, ...payloadImages };
      for (const imageKey in payloadImages) {
        if (game.images[imageKey]) {
          filesToDelete.push({ Key: join(game.id, game.images[imageKey].filename) });
        }
        payload.images[imageKey].filename = `${uuidv4()}-${payload.images[imageKey].filename}`;
        response.uploadImageURLs[imageKey] = await this.getPutSignedUrl(game.id, payload.images[imageKey], 'explorer');
      }

      if (_gallery) {
        for (const image of _gallery) {
          const item = {
            ...image,
            filename: `${uuidv4()}-${image.filename}`,
          };

          if (!payload.images.gallery) {
            payload.images.gallery = [];
          }
          if (!response.uploadImageURLs.imagesGallery) {
            response.uploadImageURLs.imagesGallery = [];
          }

          payload.images.gallery.push(item);
          response.uploadImageURLs.imagesGallery.push(await this.getPutSignedUrl(game.id, item, 'explorer'));
        }
      }
    }

    if (payload.galleryImagesForDelete && payload.galleryImagesForDelete.length) {
      payload.galleryImagesForDelete.forEach((path) => {
        const splittedPath = path.split('/');
        const filename = splittedPath[splittedPath.length - 1];
        filesToDelete.push({ Key: join(game.id, filename) });
        const indexOfImage = payload.images.gallery.map((e) => e.filename).indexOf(decodeURI(filename));
        if (indexOfImage >= 0) {
          payload.images.gallery.splice(indexOfImage, 1);
        }
      });
      delete payload.galleryImagesForDelete;
    }

    if (filesToDelete.length) {
      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: filesToDelete,
          },
        }),
      );
    }

    if (coreFilesToDelete.length) {
      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          // Bucket: this.bucketCore,
          Delete: {
            Objects: coreFilesToDelete,
          },
        }),
      );
    }

    const dataForContract: gameDataForContract = {
      owner: game.owner,
      name: game.general.name,
      author: game.general.author,
      renderer: game.connections.assetRenderer ? game.connections.assetRenderer : '',
      avatarFilter:
        game.connections.dnaFilters &&
        game.connections.dnaFilters.avatarFilter &&
        game.connections.dnaFilters.avatarFilter.filename
          ? await this.getStaticUrl(game.id, game.connections.dnaFilters.avatarFilter, this.staticEndpointCore)
          : '',
      itemFilter:
        game.connections.dnaFilters &&
        game.connections.dnaFilters.assetFilter &&
        game.connections.dnaFilters.assetFilter.filename
          ? await this.getStaticUrl(game.id, game.connections.dnaFilters.assetFilter, this.staticEndpointCore)
          : '',
      gemFilter:
        game.connections.dnaFilters &&
        game.connections.dnaFilters.gemFilter &&
        game.connections.dnaFilters.gemFilter.filename
          ? await this.getStaticUrl(game.id, game.connections.dnaFilters.gemFilter, this.staticEndpointCore)
          : '',
      website: game.connections.webpage,
    };

    if (game.recordId && game.recordId !== '') {
      console.log('!!!!!!!', game.recordId);
      try {
        await this.updateGameInContract(dataForContract, game.recordId);
      } catch (e) {
        console.log('UPDATE GAME IN CONTRACT ERROR');
      }
    }

    delete payload.owner;
    delete payload.weight;
    // delete payload.hidden;
    // Finish files part
    gameDB.set({ ...payload });
    await gameDB.save();

    return response;
  }

  async changeApprovance(id: string, approved: boolean): Promise<void> {
    await this.gameModel.findByIdAndUpdate(id, { $set: { approved } }).exec();
  }

  async findOne(id: string, user = ''): Promise<GameRecord> {
    await this.gameModel.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
    const games = await this.gameModel
      .aggregate<GameAggregationDocument>([
        { $match: { _id: new Types.ObjectId(id) } },
        this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyEvents.GameLiked, user } }]),
        this.legacyLookupPipeline('players', [{ $match: { type: LegacyEvents.GamePlayed } }]),
        this.legacyLookupPipeline('likes', [{ $match: { type: LegacyEvents.GameLiked } }]),
        this.legacyLookupPipeline('itemsUsed', [{ $match: { type: LegacyEvents.ItemUsed } }]),
        this.legacyLookupPipeline('avatarsUsed', [{ $match: { type: LegacyEvents.AvatarUsed } }]),
        {
          $addFields: {
            isLiked: { $gt: [{ $size: '$isLiked' }, 0] },
            players: { $size: '$players' },
            likes: { $size: '$likes' },
            assets: {
              items: { $size: '$itemsUsed' },
              avatars: { $size: '$avatarsUsed' },
            },
          },
        },
      ])
      .exec();
    if (!games?.[0]) {
      return null;
    }
    return await this.toGameRecord(games[0]);
  }

  async findOneByIdAndOwner(id: string, owner: string) {
    // return await this.gameModel.findOne({ _id: new Types.ObjectId(id), owner }).exec();
    return await this.gameModel.findOne({ _id: new Types.ObjectId(id) }).exec();
  }

  async random(user: string): Promise<GameResponse> {
    const games: GameRecord[] = [];
    const query = this.gameModel.aggregate<GameAggregationDocument>([
      { $match: { approved: true, hidden: false } },
      { $sample: { size: 5 } },
      this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyEvents.GameLiked, user } }]),
      this.legacyLookupPipeline('players', [{ $match: { type: LegacyEvents.GamePlayed } }]),
      this.legacyLookupPipeline('likes', [{ $match: { type: LegacyEvents.GameLiked } }]),
      this.legacyLookupPipeline('itemsUsed', [{ $match: { type: LegacyEvents.ItemUsed } }]),
      this.legacyLookupPipeline('avatarsUsed', [{ $match: { type: LegacyEvents.AvatarUsed } }]),
      {
        $addFields: {
          isLiked: { $gt: [{ $size: '$isLiked' }, 0] },
          players: { $size: '$players' },
          likes: { $size: '$likes' },
          assets: {
            items: { $size: '$itemsUsed' },
            avatars: { $size: '$avatarsUsed' },
          },
        },
      },
    ]);
    for (const game of await query.exec()) {
      games.push(await this.toGameRecord(game));
    }
    const total = await this.gameModel.countDocuments({ approved: true, hidden: false });
    return { data: games, meta: { total, page: 1, perPage: 10 } };
  }

  async find(filters: ListGamesFilters): Promise<GameResponse> {
    const matchParams: Record<string, any> = {};
    if (filters.search) {
      matchParams['general.name'] = { $in: [new RegExp(filters.search, 'gi')] };
    }

    if (filters.approved) {
      matchParams['approved'] = filters.approved;
    }

    if (filters.hidden === true || filters.hidden === false) {
      matchParams['hidden'] = filters.hidden;
    }

    if (filters.owner && filters.owner !== '') {
      matchParams['owner'] = filters.owner;
    }

    const sortParams: Record<string, any> = {};
    if (filters.list === 'popular') {
      sortParams.views = -1;
    } else {
      sortParams.weight = -1;
    }

    if (filters.ids) {
      matchParams['_id'] = { $in: filters.ids };
    }
    return await this.aggregateGames(matchParams, sortParams, filters.page, filters.user);
  }

  async search(name: string): Promise<SmallGameRecord[]> {
    const games: SmallGameRecord[] = [];
    const results: GameDocument[] = await this.gameModel
      .find({
        'general.name': { $in: [new RegExp(name, 'gi')] },
        approved: true,
      })
      .sort({ weight: -1 });

    for (const game of results) {
      games.push(await this.toSearchGameRecord(game));
    }
    return games;
  }

  async delete(game: GameDocument) {
    const filesToDelete = [];
    const coreFilesToDelete = [];
    for (const filterKey in game.connections.dnaFilters) {
      if (game.connections.dnaFilters[filterKey] && game.connections.dnaFilters[filterKey].filename) {
        coreFilesToDelete.push({ Key: join(game.id, game.connections.dnaFilters[filterKey].filename) });
      }
    }
    for (const imageKey in game.images) {
      if (game.images[imageKey] && game.images[imageKey].filename && imageKey !== 'gallery') {
        filesToDelete.push({ Key: join(game.id, game.images[imageKey].filename) });
      }
    }

    game.images.gallery?.forEach((image) => {
      filesToDelete.push({ Key: join(game.id, image.filename) });
    });

    const deleteS3Result = await this.s3Client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: filesToDelete,
        },
      }),
    );

    await this.s3Client.send(
      new DeleteObjectsCommand({
        // Bucket: this.bucketCore,
        Bucket: this.bucket,
        Delete: {
          Objects: coreFilesToDelete,
        },
      }),
    );

    const deleteDBResult = await this.gameModel.deleteOne({ _id: game._id });

    return {
      images: deleteS3Result?.Deleted?.length > 0,
      db: deleteDBResult?.deletedCount > 0,
    };
  }

  async favorites(user: string, page: number): Promise<GameResponse> {
    const favorites = await this.legacyService.getFavoritesIDs('gameLiked', user, page, this.perPage);

    const result = await this.find({ ids: favorites.ids, list: 'latest', page: 1, user });

    result.meta = {
      total: favorites.count,
      perPage: this.perPage,
      page,
    };

    return result;
  }

  private async createGameInContract(data: gameDataForContract): Promise<string> {
    const url = new URL(this.gameDirectoryEndpoint);
    url.pathname = '/games-directory';
    const request = this.httpService
      .post(url.toString(), data)
      .pipe(map((res) => res.data?.txHash))
      .pipe(
        catchError((e) => {
          console.log(`Create game in contract error: ${e.response?.data}`);
          throw new ForbiddenException('API not available');
        }),
      );
    return await lastValueFrom(request);
  }

  private async updateGameInContract(data: gameDataForContract, id: string): Promise<string> {
    const url = new URL(this.gameDirectoryEndpoint);
    url.pathname = `/games-directory/${id}`;
    const request = this.httpService
      .patch(url.toString(), data)
      .pipe(map((res) => res.data?.txHash))
      .pipe(
        catchError((e) => {
          console.log(e.response?.data);
          throw new ForbiddenException('API not available');
        }),
      );
    return await lastValueFrom(request);
  }

  private async aggregateGames(
    matchParams: Record<string, any>,
    sortParams: Record<string, any>,
    page: number,
    user = '',
  ): Promise<GameResponse> {
    const games: Array<GameRecord> = [];
    const aggregation = this.gameModel.aggregate<GameAggregationDocument>([
      { $match: { ...matchParams } },
      { $sort: { ...sortParams } },
      { $skip: (page - 1) * this.perPage },
      { $limit: this.perPage },
      this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyEvents.GameLiked, user } }]),
      this.legacyLookupPipeline('players', [{ $match: { type: LegacyEvents.GamePlayed } }]),
      this.legacyLookupPipeline('likes', [{ $match: { type: LegacyEvents.GameLiked } }]),
      this.legacyLookupPipeline('itemsUsed', [{ $match: { type: LegacyEvents.ItemUsed } }]),
      this.legacyLookupPipeline('avatarsUsed', [{ $match: { type: LegacyEvents.AvatarUsed } }]),
      {
        $addFields: {
          isLiked: { $gt: [{ $size: '$isLiked' }, 0] },
          players: { $size: '$players' },
          likes: { $size: '$likes' },
          assets: {
            items: { $size: '$itemsUsed' },
            avatars: { $size: '$avatarsUsed' },
          },
        },
      },
    ]);
    const total = await this.gameModel.countDocuments({ approved: true, ...matchParams });
    for (const game of await aggregation.exec()) {
      games.push(await this.toGameRecord(game));
    }
    return { data: games, meta: { total, perPage: this.perPage, page: page } };
  }

  private async toSearchGameRecord(game: GameDocument): Promise<SmallGameRecord> {
    const gameId = game._id.toString();
    return {
      id: gameId,
      general: {
        name: game.general.name,
        genre: game.general.genre,
      },
      images: {
        smallThumbnail: await this.getStaticUrl(gameId, game.images.smallThumbnail, this.staticEndpoint),
      },
      connections: {
        assetRenderer: game.connections.assetRenderer,
        dnaFilters: {
          avatarFilter:
            game.connections.dnaFilters && game.connections.dnaFilters.avatarFilter
              ? await this.getStaticUrl(gameId, game.connections.dnaFilters.avatarFilter, this.staticEndpointCore)
              : '',
          assetFilter:
            game.connections.dnaFilters && game.connections.dnaFilters.assetFilter
              ? await this.getStaticUrl(gameId, game.connections.dnaFilters.assetFilter, this.staticEndpointCore)
              : '',
          gemFilter:
            game.connections.dnaFilters && game.connections.dnaFilters.gemFilter
              ? await this.getStaticUrl(gameId, game.connections.dnaFilters.gemFilter, this.staticEndpointCore)
              : '',
        },
      },
    };
  }

  private legacyLookupPipeline(as: string, pipeline: any[]) {
    return {
      $lookup: {
        from: 'legacyRecords',
        localField: '_id',
        foreignField: 'gameId',
        pipeline,
        as,
      },
    };
  }

  private async toGameRecord(game: GameAggregationDocument): Promise<GameRecord> {
    const gameId = game._id.toString();

    return {
      id: gameId,
      owner: game.owner,
      views: game.views,
      isLiked: game.isLiked,
      players: game.players,
      likes: game.likes,
      assets: game.assets,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      general: {
        name: game.general.name,
        author: game.general.author,
        description: game.general.description,
        fullDescription: game.general.fullDescription,
        genre: game.general.genre,
      },
      details: {
        status: game.details.status,
        platforms: game.details.platforms,
        madeWith: game.details.madeWith,
        session: game.details.session,
        languages: game.details.languages,
        inputs: game.details.inputs,
      },
      images: {
        coverImage: await this.getStaticUrl(gameId, game.images.coverImage, this.staticEndpoint),
        cardThumbnail: await this.getStaticUrl(gameId, game.images.cardThumbnail, this.staticEndpoint),
        smallThumbnail: await this.getStaticUrl(gameId, game.images.smallThumbnail, this.staticEndpoint),
        gallery: await this.getStaticUrls(gameId, game.images.gallery, this.staticEndpoint),
      },
      connections: {
        webpage: game.connections.webpage,
        assetRenderer: game.connections.assetRenderer,
        dnaFilters: {
          avatarFilter:
            game.connections.dnaFilters?.avatarFilter &&
            (await this.getStaticUrl(gameId, game.connections.dnaFilters.avatarFilter, this.staticEndpointCore)),
          assetFilter:
            game.connections.dnaFilters?.assetFilter &&
            (await this.getStaticUrl(gameId, game.connections.dnaFilters.assetFilter, this.staticEndpointCore)),
          gemFilter:
            game.connections.dnaFilters?.gemFilter &&
            (await this.getStaticUrl(gameId, game.connections.dnaFilters.gemFilter, this.staticEndpointCore)),
        },
        promoVideo: game.connections.promoVideo,
        socialLinks: game.connections.socialLinks,
      },
      contacts: {
        email: game.contacts.email,
        discord: game.contacts.discord,
      },
    };
  }

  private async getPutSignedUrl(
    gameId: string,
    { filename, mimeType, contentLength }: GameImage,
    bucket: string,
  ): Promise<string> {
    return getSignedUrl(
      // bucket === 'explorer' ? this.s3Client : this.s3GDNClient,
      this.s3Client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: join(gameId, filename),
        ContentType: mimeType,
        ContentLength: contentLength,
      }),
      { expiresIn: 3600 },
    );
  }

  private async getPutSignedUrls(gameId: string, gameImages: GameImage[], bucket: string): Promise<string[]> {
    const images = [];
    for await (const image of gameImages) {
      images.push(await this.getPutSignedUrl(gameId, image, bucket));
    }
    return images;
  }

  private async getStaticUrl(gameId: string, { filename }: GameImage, endpoint: URL): Promise<string> {
    const url = new URL(endpoint);
    url.pathname = join(gameId, filename);
    return url.toString();
  }

  private async getStaticUrls(gameId: string, gameImages: GameImage[], endpoint: URL): Promise<string[]> {
    const images = [];
    for await (const image of gameImages) {
      images.push(await this.getStaticUrl(gameId, image, endpoint));
    }
    return images;
  }
}
