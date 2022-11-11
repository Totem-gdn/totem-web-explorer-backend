import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Model, Types } from 'mongoose';
import { Game, GameAggregationDocument, GameDocument } from './schemas/games';
import { ConfigService } from '@nestjs/config';
import { ListGamesFilters } from './interfaces/listGamesFilters';
import { LegacyEvents } from '../legacy/enums/legacy.enums';
import { GameImage } from './interfaces/gameImage';
import { GameRecord, SmallGameRecord } from './interfaces/gameRecord';
import { CreateGameRequest } from './interfaces/createGameRequest';
import { UpdateGameRequest } from './interfaces/updateGameRequest';
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
    const newGame = await this.gameModel.create(game);
    return {
      id: newGame.id,
      connections: {
        dnaFilters: {
          avatarFilter:
            game.connections.dnaFilters?.avatarFilter &&
            (await this.getPutSignedUrl(newGame.id, game.connections.dnaFilters.avatarFilter)),
          assetFilter:
            game.connections.dnaFilters?.assetFilter &&
            (await this.getPutSignedUrl(newGame.id, game.connections.dnaFilters.assetFilter)),
          gemFilter:
            game.connections.dnaFilters?.gemFilter &&
            (await this.getPutSignedUrl(newGame.id, game.connections.dnaFilters.gemFilter)),
        },
      },
      uploadImageURLs: {
        coverImage: await this.getPutSignedUrl(newGame.id, game.images.coverImage),
        cardThumbnail: await this.getPutSignedUrl(newGame.id, game.images.cardThumbnail),
        smallThumbnail: await this.getPutSignedUrl(newGame.id, game.images.smallThumbnail),
        imagesGallery: await this.getPutSignedUrls(newGame.id, game.images.gallery),
      },
    };
  }

  async update(game: GameDocument, payload: UpdateGameRequest): Promise<UpdateGameResponse> {
    const response: UpdateGameResponse = {
      id: game.id,
    };

    // files part
    const filesToDelete = [];
    if (payload.connections?.dnaFilters) {
      response.connections = { dnaFilters: {} };
      const dnaFilters = payload.connections.dnaFilters;
      payload.connections.dnaFilters = { ...payload.connections.dnaFilters, ...game.connections.dnaFilters };
      for (const dnaFiltersKey in game.connections.dnaFilters) {
        if (game.connections.dnaFilters[dnaFiltersKey] && game.connections.dnaFilters[dnaFiltersKey].filename) {
          filesToDelete.push({ Key: join(game.id, game.connections.dnaFilters[dnaFiltersKey].filename) }); // DNA JSON
        }
      }
      for (const dnaFiltersKey in dnaFilters) {
        payload.connections.dnaFilters[dnaFiltersKey].filename = `${uuidv4()}-${
          payload.connections.dnaFilters[dnaFiltersKey].filename
        }`;
        response.connections.dnaFilters[dnaFiltersKey] = await this.getPutSignedUrl(
          game.id,
          payload.connections.dnaFilters[dnaFiltersKey],
        );
      }
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
        response.uploadImageURLs[imageKey] = await this.getPutSignedUrl(game.id, payload.images[imageKey]);
      }
      // FIXME: how to delete specific gallery image from payload?
    }

    if (payload.galleryImagesForDelete && payload.galleryImagesForDelete.length) {
      const newGames = game.images.gallery;
      payload.galleryImagesForDelete.forEach((path) => {
        const splittedPath = path.split('/');
        const filename = splittedPath[splittedPath.length - 1];
        filesToDelete.push({ Key: join(game.id, filename) });
        const indexOfGame = newGames.map((e) => e.filename).indexOf('afe5f0d9-e4b1-4187-88f0-6e8c66992692-SS_02.png');
        newGames.splice(indexOfGame, 1);
      });
      payload.images.gallery = newGames;

      delete payload.galleryImagesForDelete;
    }

    if (payload.images && payload.images.gallery && payload.images.gallery.length) {
      const galleryImagesForUpload = payload.images.gallery;
      payload.images.gallery = game.images.gallery;
      if (!response.uploadImageURLs.imagesGallery) {
        response.uploadImageURLs.imagesGallery = [];
      }
      for (const image of galleryImagesForUpload) {
        const imageObj = {
          ...image,
          filename: `${uuidv4()}-${image.filename}`,
        };
        payload.images.gallery.push(imageObj);
        response.uploadImageURLs.imagesGallery.push(await this.getPutSignedUrl(game.id, imageObj));
      }
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

    console.log(payload);
    // Finish files part
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
    return await this.gameModel.findOne({ _id: new Types.ObjectId(id), owner }).exec();
    // return await this.gameModel.findOne({ _id: new Types.ObjectId(id) }).exec();
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

  async search(name: string): Promise<SmallGameRecord[]> {
    const games: SmallGameRecord[] = [];
    const results: GameDocument[] = await this.gameModel.find({
      'general.name': { $in: [new RegExp(name, 'gi')] },
      approved: true,
    });

    for (const game of results) {
      games.push(await this.toSearchGameRecord(game));
    }
    return games;
  }

  async delete(game: GameDocument) {
    const filesToDelete = [];
    for (const filterKey in game.connections.dnaFilters) {
      filesToDelete.push({ Key: join(game.id, game.connections.dnaFilters[filterKey].filename) });
    }
    for (const imageKey in game.images) {
      filesToDelete.push({ Key: join(game.id, game.images[imageKey].filename) });
    }

    filesToDelete.push({ Key: join(game.id, game.images.coverImage?.filename) }); // coverImage
    filesToDelete.push({ Key: join(game.id, game.images.cardThumbnail?.filename) }); // cardThumbnail
    filesToDelete.push({ Key: join(game.id, game.images.smallThumbnail?.filename) }); // smallThumbnail

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
    // await game.deleteOne();
    const deleteDBResult = await this.gameModel.deleteOne({ _id: game._id });

    return {
      images: deleteS3Result?.Deleted?.length > 0,
      db: deleteDBResult?.deletedCount > 0,
    };
  }

  private async aggregateGames(
    matchParams: Record<string, any>,
    sortParams: Record<string, any>,
    page: number,
    user = '',
  ): Promise<GameRecord[]> {
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
    for (const game of await aggregation.exec()) {
      games.push(await this.toGameRecord(game));
    }
    return games;
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
        smallThumbnail: await this.getStaticUrl(gameId, game.images.smallThumbnail),
      },
      connections: {
        assetRenderer: game.connections.assetRenderer,
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
        dnaFilters: {
          avatarFilter:
            game.connections.dnaFilters?.avatarFilter &&
            (await this.getStaticUrl(gameId, game.connections.dnaFilters.avatarFilter)),
          assetFilter:
            game.connections.dnaFilters?.assetFilter &&
            (await this.getStaticUrl(gameId, game.connections.dnaFilters.assetFilter)),
          gemFilter:
            game.connections.dnaFilters?.gemFilter &&
            (await this.getStaticUrl(gameId, game.connections.dnaFilters.gemFilter)),
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
