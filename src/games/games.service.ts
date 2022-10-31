import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PutObjectCommand, DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Model, Types } from 'mongoose';
import { Game, GameAggregationDocument, GameDocument } from './schemas/games';
import { ConfigService } from '@nestjs/config';
import { ListGamesFilters } from './interfaces/listGamesFilters';
import { LegacyEvents } from '../legacy/enums/legacy.enums';
import { GameImage } from './interfaces/gameImage';
import { GameRecord } from './interfaces/gameRecord';
import { CreateGameRequest } from './interfaces/createGameRequest';
import { UpdateGameRequest } from './interfaces/UpdateGameRequest';
import { CreateGameResponse } from './interfaces/createGameResponse';
import { UpdateGameResponse } from './interfaces/updateGameResponse';

@Injectable()
export class GamesService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly staticEndpoint: URL;
  private readonly perPage: number = 10;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
  ) {
    this.s3Client = new S3Client({});
    this.bucket = this.configService.get<string>('aws.s3.bucket');
    this.staticEndpoint = new URL(this.configService.get<string>('aws.s3.endpoint'));
  }

  async create(game: CreateGameRequest): Promise<CreateGameResponse> {
    if (game.connections.dnaFilter) {
      game.connections.dnaFilter.filename = `${uuidv4()}-${game.connections.dnaFilter.filename}`;
    }
    game.images.coverImage.filename = `${uuidv4()}-${game.images.coverImage.filename}`;
    game.images.cardThumbnail.filename = `${uuidv4()}-${game.images.cardThumbnail.filename}`;
    game.images.smallThumbnail.filename = `${uuidv4()}-${game.images.smallThumbnail.filename}`;
    for (const image of game.images.gallery) {
      image.filename = `${uuidv4()}-${image.filename}`;
    }
    const newGame = await this.gameModel.create(game);
    return {
      id: newGame.id,
      connections: {
        dnaFilter: game.connections.dnaFilter && (await this.getPutSignedUrl(newGame.id, game.connections.dnaFilter)),
      },
      uploadImageURLs: {
        coverImage: await this.getPutSignedUrl(newGame.id, game.images.coverImage),
        cardThumbnail: await this.getPutSignedUrl(newGame.id, game.images.cardThumbnail),
        smallThumbnail: await this.getPutSignedUrl(newGame.id, game.images.smallThumbnail),
        imagesGallery: await this.getPutSignedUrls(newGame.id, game.images.gallery),
      },
    };
  }

  async update(id: string, payload: UpdateGameRequest, game): Promise<UpdateGameResponse> {
    const response: UpdateGameResponse = {
      id,
    };

    // files part
    const filesForDelete = [];
    if (payload.connections?.dnaFilter) {
      if (game.connections?.dnaFilter) {
        filesForDelete.push({ Key: join(id.toString(), game.connections.dnaFilter) }); // DNA JSON
      }
      payload.connections.dnaFilter.filename = `${uuidv4()}-${payload.connections.dnaFilter.filename}`;
      response.connections = {
        dnaFilter: await this.getPutSignedUrl(id, payload.connections.dnaFilter),
      };
    }

    if (payload.images) {
      if (payload.images.coverImage) {
        if (game.images.coverImage) {
          filesForDelete.push({ Key: join(id.toString(), game.images.coverImage) }); // Cover Image
        }
        payload.images.coverImage.filename = `${uuidv4()}-${payload.images.coverImage.filename}`;
        response.uploadImageURLs = {
          ...response.uploadImageURLs,
          coverImage: await this.getPutSignedUrl(id, payload.images.coverImage),
        };
      }
      if (payload.images.cardThumbnail) {
        if (game.images.cardThumbnail) {
          filesForDelete.push({ Key: join(id.toString(), game.images.cardThumbnail) }); // Card Thumbnail Image
        }
        payload.images.cardThumbnail.filename = `${uuidv4()}-${payload.images.cardThumbnail.filename}`;
        response.uploadImageURLs = {
          ...response.uploadImageURLs,
          cardThumbnail: await this.getPutSignedUrl(id, payload.images.cardThumbnail),
        };
      }
      if (payload.images.smallThumbnail) {
        if (game.images.smallThumbnail) {
          filesForDelete.push({ Key: join(id.toString(), game.images.smallThumbnail) }); // Snall Thumbnail Image
        }
        payload.images.smallThumbnail.filename = `${uuidv4()}-${payload.images.smallThumbnail.filename}`;
        response.uploadImageURLs = {
          ...response.uploadImageURLs,
          smallThumbnail: await this.getPutSignedUrl(id, payload.images.smallThumbnail),
        };
      }
    }
    // Finish files part

    game.set({ ...payload });

    await game.save();

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
    const game = await this.gameModel.findOne({ _id: id, owner }).exec();

    return game ? game : null;
  }

  async random(user: string): Promise<GameRecord[]> {
    const games: GameRecord[] = [];
    const query = this.gameModel.aggregate<GameAggregationDocument>([
      { $match: { approved: true } },
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
    return games;
  }

  async find(filters: ListGamesFilters): Promise<GameRecord[]> {
    const matchParams: Record<string, any> = {};
    if (filters.search) {
      matchParams['general.name'] = { $in: [new RegExp(filters.search, 'gi')] };
    }

    matchParams['approved'] = filters.approved;
    if (filters.owner !== '') {
      matchParams['owner'] = filters.owner;
    }

    const sortParams: Record<string, any> = {};
    if (filters.list === 'popular') {
      sortParams.views = -1;
    } else {
      sortParams.createdAt = -1;
    }
    return await this.aggregateGames(matchParams, sortParams, filters.page, filters.user);
  }

  async delete(game) {
    const imagesForDelete = [];
    if (game.connections && game.connections.dnaFilter) {
      imagesForDelete.push({ Key: join(game._id.toString(), game.connections.dnaFilter) }); // DNA JSON
    }
    imagesForDelete.push({ Key: join(game._id.toString(), game.images?.coverImage?.filename) }); // coverImage
    imagesForDelete.push({ Key: join(game._id.toString(), game.images?.cardThumbnail?.filename) }); // cardThumbnail
    imagesForDelete.push({ Key: join(game._id.toString(), game.images?.smallThumbnail?.filename) }); // smallThumbnail

    game.images?.gallery?.forEach((image) => {
      imagesForDelete.push({ Key: join(game._id.toString(), image.filename) });
    });

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: imagesForDelete,
      },
    });

    const deleteS3Result = await this.s3Client.send(deleteCommand);

    const deleteDBResult = await this.gameModel.deleteOne({ _id: game._id });

    return {
      images: deleteS3Result?.Deleted?.length > 0 ? true : false,
      db: deleteDBResult?.deletedCount > 0 ? true : false,
    };
  }

  private async aggregateGames(
    matchParams: Record<string, any>,
    sortParams: Record<string, any>,
    page: number,
    user = '',
  ): Promise<GameRecord[]> {
    const games: GameRecord[] = [];
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
    for (const game of await aggregation.exec()) {
      if (matchParams['general.name']) {
        games.push(await this.toSearchGameRecord(game));
      } else {
        games.push(await this.toGameRecord(game));
      }
    }
    return games;
  }

  private async toSearchGameRecord(game) {
    const gameId = game._id.toString();
    return {
      id: gameId,
      general: {
        name: game.general.name,
      },
      images: {
        smallThumbnail: await this.getStaticUrl(gameId, game.images.smallThumbnail),
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
        coverImage: await this.getStaticUrl(gameId, game.images.coverImage),
        cardThumbnail: await this.getStaticUrl(gameId, game.images.cardThumbnail),
        smallThumbnail: await this.getStaticUrl(gameId, game.images.smallThumbnail),
        gallery: await this.getStaticUrls(gameId, game.images.gallery),
      },
      connections: {
        webpage: game.connections.webpage,
        assetRenderer: game.connections.assetRenderer,
        dnaFilter: game.connections.dnaFilter ? await this.getStaticUrl(gameId, game.connections.dnaFilter) : '',
        promoVideo: game.connections.promoVideo,
        socialLinks: game.connections.socialLinks,
      },
      contacts: {
        email: game.contacts.email,
        discord: game.contacts.discord,
      },
    };
  }

  private async getPutSignedUrl(gameId: string, { filename, mimeType, contentLength }: GameImage): Promise<string> {
    return getSignedUrl(
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

  private async getPutSignedUrls(gameId: string, gameImages: GameImage[]): Promise<string[]> {
    const images = [];
    for await (const image of gameImages) {
      images.push(await this.getPutSignedUrl(gameId, image));
    }
    return images;
  }

  private async getStaticUrl(gameId: string, { filename }: GameImage): Promise<string> {
    const url = new URL(this.staticEndpoint);
    url.pathname = join(gameId, filename);
    return url.toString();
  }

  private async getStaticUrls(gameId: string, gameImages: GameImage[]): Promise<string[]> {
    const images = [];
    for await (const image of gameImages) {
      images.push(await this.getStaticUrl(gameId, image));
    }
    return images;
  }
}
