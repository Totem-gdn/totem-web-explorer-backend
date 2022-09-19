export interface IIntegration {
  type: string;
  url: string;
}

export interface IImageData {
  filename: string;
  mimeType: string;
  contentLength: number;
}

export interface IGameRecord {
  id: string;
  ownerAddress: string;
  createdAt: string;
  updatedAt: string;
  general: {
    name: string;
    author: string;
    description: string;
    fullDescription: string;
    genre: string[];
  };
  details: {
    status: string;
    platforms: string;
    madeWith: string;
    averageSession: string;
    languages: string;
    inputs: string;
  };
  images: {
    coverImage: string;
    cardThumbnail: string;
    smallThumbnail: string;
    imagesGallery: Array<string>
  };
  socialMedia: {
    promoVideo: string;
    integrations: Array<IIntegration>
  };
  contacts: {
    email: string;
    discord: string;
  };
}

export interface ICreateGameRequest {
  ownerAddress: string;
  general: {
    name: string;
    author: string;
    description: string;
    fullDescription: string;
    genre: string[];
  };
  details: {
    status: string;
    platforms: string;
    madeWith: string;
    averageSession: string;
    languages: string;
    inputs: string;
  };
  images: {
    coverImage: IImageData;
    cardThumbnail: IImageData;
    smallThumbnail: IImageData;
    imagesGallery: Array<IImageData>
  };
  socialMedia: {
    promoVideo: string;
    integrations: Array<IIntegration>
  };
  contacts: {
    email: string;
    discord: string;
  };
}

export interface ICreateGameResponse {
  id: string;
  uploadImageURLs: {
    coverImage: string;
    cardThumbnail: string;
    smallThumbnail: string;
    imagesGallery: Array<string>;
  };
}

export interface IFindGamesQuery {

  from_timestamp: string;
}
