import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Model, Types } from 'mongoose';
import { Game, GameAggregationDocument, GameDocument } from './games.schema';
import { ConfigService } from '@nestjs/config';
import {
  ICreateGameRequest,
  ICreateGameResponse,
  IGameImage,
  IGameRecord,
  IListGamesFilters,
} from './games.interfaces';
import { LegacyTypes } from '../legacy/legacy.constants';

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

  async create(game: ICreateGameRequest): Promise<ICreateGameResponse> {
    game.images.coverImage.filename = `${uuidv4()}-${game.images.coverImage.filename}`;
    game.images.cardThumbnail.filename = `${uuidv4()}-${game.images.cardThumbnail.filename}`;
    game.images.smallThumbnail.filename = `${uuidv4()}-${game.images.smallThumbnail.filename}`;
    for (const image of game.images.gallery) {
      image.filename = `${uuidv4()}-${image.filename}`;
    }
    const newGame = await this.gameModel.create(game);
    return {
      id: newGame.id,
      uploadImageURLs: {
        coverImage: await this.getPutSignedUrl(newGame.id, game.images.coverImage),
        cardThumbnail: await this.getPutSignedUrl(newGame.id, game.images.cardThumbnail),
        smallThumbnail: await this.getPutSignedUrl(newGame.id, game.images.smallThumbnail),
        imagesGallery: await this.getPutSignedUrls(newGame.id, game.images.gallery),
      },
    };
  }

  async changeApprovance(id: string, approved: boolean): Promise<void> {
    await this.gameModel.findByIdAndUpdate(id, { $set: { approved } }).exec();
  }

  async findOne(id: string, user = ''): Promise<IGameRecord> {
    await this.gameModel.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
    const games = await this.gameModel
      .aggregate<GameAggregationDocument>([
        { $match: { _id: new Types.ObjectId(id) } },
        this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyTypes.GameLiked, user } }]),
        this.legacyLookupPipeline('players', [{ $match: { type: LegacyTypes.GamePlayed } }]),
        this.legacyLookupPipeline('likes', [{ $match: { type: LegacyTypes.GameLiked } }]),
        this.legacyLookupPipeline('itemsUsed', [{ $match: { type: LegacyTypes.ItemUsed } }]),
        this.legacyLookupPipeline('avatarsUsed', [{ $match: { type: LegacyTypes.AvatarUsed } }]),
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

  async random(user: string): Promise<IGameRecord[]> {
    const games: IGameRecord[] = [];
    const query = this.gameModel.aggregate<GameAggregationDocument>([
      { $match: { approved: true } },
      { $sample: { size: 5 } },
      this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyTypes.GameLiked, user } }]),
      this.legacyLookupPipeline('players', [{ $match: { type: LegacyTypes.GamePlayed } }]),
      this.legacyLookupPipeline('likes', [{ $match: { type: LegacyTypes.GameLiked } }]),
      this.legacyLookupPipeline('itemsUsed', [{ $match: { type: LegacyTypes.ItemUsed } }]),
      this.legacyLookupPipeline('avatarsUsed', [{ $match: { type: LegacyTypes.AvatarUsed } }]),
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

  async find(filters: IListGamesFilters): Promise<IGameRecord[]> {
    const matchParams: Record<string, any> = {};
    if (filters.search) {
      matchParams['general.name'] = { $regex: filters.search, $options: 'i' };
    }
    const sortParams: Record<string, any> = {};
    if (filters.list === 'popular') {
      sortParams.views = -1;
    } else {
      sortParams.createdAt = -1;
    }
    return await this.aggregateGames(matchParams, sortParams, filters.page, filters.user);
  }

  private async aggregateGames(
    matchParams: Record<string, any>,
    sortParams: Record<string, any>,
    page: number,
    user = '',
  ): Promise<IGameRecord[]> {
    const games: IGameRecord[] = [];
    const aggregation = this.gameModel.aggregate<GameAggregationDocument>([
      { $match: { approved: true, ...matchParams } },
      { $sort: { ...sortParams } },
      { $skip: (page - 1) * this.perPage },
      { $limit: this.perPage },
      this.legacyLookupPipeline('isLiked', [{ $match: { type: LegacyTypes.GameLiked, user } }]),
      this.legacyLookupPipeline('players', [{ $match: { type: LegacyTypes.GamePlayed } }]),
      this.legacyLookupPipeline('likes', [{ $match: { type: LegacyTypes.GameLiked } }]),
      this.legacyLookupPipeline('itemsUsed', [{ $match: { type: LegacyTypes.ItemUsed } }]),
      this.legacyLookupPipeline('avatarsUsed', [{ $match: { type: LegacyTypes.AvatarUsed } }]),
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

  private async toGameRecord(game: GameAggregationDocument): Promise<IGameRecord> {
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
        promoVideo: game.connections.promoVideo,
        socialLinks: game.connections.socialLinks,
      },
      contacts: {
        email: game.contacts.email,
        discord: game.contacts.discord,
      },
    };
  }

  private async getPutSignedUrl(gameId: string, { filename, mimeType, contentLength }: IGameImage): Promise<string> {
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

  private async getPutSignedUrls(gameId: string, gameImages: IGameImage[]): Promise<string[]> {
    const images = [];
    for await (const image of gameImages) {
      images.push(await this.getPutSignedUrl(gameId, image));
    }
    return images;
  }

  private async getStaticUrl(gameId: string, { filename }: IGameImage): Promise<string> {
    const url = new URL(this.staticEndpoint);
    url.pathname = join(gameId, filename);
    return url.toString();
  }

  private async getStaticUrls(gameId: string, gameImages: IGameImage[]): Promise<string[]> {
    const images = [];
    for await (const image of gameImages) {
      images.push(await this.getStaticUrl(gameId, image));
    }
    return images;
  }
}
