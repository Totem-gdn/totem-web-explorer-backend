import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Model } from 'mongoose';
import { Game, GameDocument } from './schemas/game.schema';
import { ConfigService } from '@nestjs/config';
import { ICreateGameRequest, ICreateGameResponse, IGameRecord, IImageData } from './interfaces/games.interfaces';

@Injectable()
export class GamesService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly staticEndpoint: URL;

  constructor(
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    private readonly configService: ConfigService
  ) {
    this.s3Client = new S3Client({});
    this.bucket = this.configService.get<string>('aws.s3.bucket');
    this.staticEndpoint = new URL(this.configService.get<string>('aws.s3.endpoint'));
  }

  async create(game: ICreateGameRequest): Promise<ICreateGameResponse> {
    game.images.coverImage.filename = `${uuidv4()}-${game.images.coverImage.filename}`;
    game.images.cardThumbnail.filename = `${uuidv4()}-${game.images.cardThumbnail.filename}`;
    game.images.smallThumbnail.filename = `${uuidv4()}-${game.images.smallThumbnail.filename}`;
    for (let image of game.images.imagesGallery) {
      image.filename = `${uuidv4()}-${image.filename}`;
    }
    const { id } = await this.gameModel.create(game);
    return {
      id,
      uploadImageURLs: {
        coverImage: await this.getPutSignedUrl(id, game.images.coverImage),
        cardThumbnail: await this.getPutSignedUrl(id, game.images.cardThumbnail),
        smallThumbnail: await this.getPutSignedUrl(id, game.images.smallThumbnail),
        imagesGallery: await (async () => {
          const images = [];
          for await (let image of game.images.imagesGallery) {
            images.push(await this.getPutSignedUrl(id, image));
          }
          return images;
        })(),
      }
    };
  }

  async findOne(id: string): Promise<IGameRecord> {
    const game = await this.gameModel.findById(id).exec();
    return await this.gameDocumentToRecord(game);
  }

  async find(): Promise<IGameRecord[]> {
    const query = this.gameModel
      .find({ visible: true })
      .sort({ createdAt: 'desc' })
      .limit(12);
    const games = [];
    for await (const game of await query.exec()) {
      games.push(await this.gameDocumentToRecord(game));
    }
    return games;
  }

  private async gameDocumentToRecord(game: GameDocument): Promise<IGameRecord> {
    return {
      id: game.id,
      ownerAddress: game.ownerAddress,
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
        averageSession: game.details.averageSession,
        languages: game.details.languages,
        inputs: game.details.inputs,
      },
      images: {
        coverImage: await this.getStaticUrl(game.id, game.images.coverImage),
        cardThumbnail: await this.getStaticUrl(game.id, game.images.cardThumbnail),
        smallThumbnail: await this.getStaticUrl(game.id, game.images.smallThumbnail),
        imagesGallery: await (async () => {
          const images = [];
          for await (let image of game.images.imagesGallery) {
            images.push(await this.getStaticUrl(game.id, image));
          }
          return images;
        })()
      },
      socialMedia: {
        promoVideo: game.socialMedia.promoVideo,
        integrations: game.socialMedia.integrations,
      },
      contacts: {
        email: game.contacts.email,
        discord: game.contacts.discord,
      },
    };
  }

  private async getPutSignedUrl(gameId: string, { filename, mimeType, contentLength }: IImageData): Promise<string> {
    return getSignedUrl(this.s3Client, new PutObjectCommand({
      Bucket: this.bucket,
      Key: join(gameId, filename),
      ContentType: mimeType,
      ContentLength: contentLength,
    }), { expiresIn: 3600 });
  }

  private async getStaticUrl(gameId: string, { filename }: IImageData): Promise<string> {
    const url = new URL(this.staticEndpoint);
    url.pathname = join(gameId, filename);
    return url.toString();
  }
}
