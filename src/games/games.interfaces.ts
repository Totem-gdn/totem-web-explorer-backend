export interface ISocialLink {
  type: string;
  url: string;
}

export interface IGameImage {
  filename: string;
  mimeType: string;
  contentLength: number;
}

export interface IGameRecord {
  id: string;
  owner: string;
  views: number;
  isLiked: boolean;
  players: number;
  likes: number;
  assets: { avatars: number; items: number };
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
    platforms: string[];
    madeWith: string;
    session: string;
    languages: string;
    inputs: string;
  };
  images: {
    coverImage: string;
    cardThumbnail: string;
    smallThumbnail: string;
    gallery: string[];
  };
  connections: {
    webpage: string;
    assetRenderer: string;
    promoVideo: string;
    socialLinks: ISocialLink[];
  };
  contacts: {
    email: string;
    discord: string;
  };
}

export interface ICreateGameRequest {
  owner: string;
  general: {
    name: string;
    author: string;
    description: string;
    fullDescription: string;
    genre: string[];
  };
  details: {
    status: string;
    platforms: string[];
    madeWith: string;
    session: string;
    languages: string;
    inputs: string;
  };
  images: {
    coverImage: IGameImage;
    cardThumbnail: IGameImage;
    smallThumbnail: IGameImage;
    gallery: IGameImage[];
  };
  connections: {
    webpage: string;
    assetRenderer: string;
    promoVideo: string;
    socialLinks: ISocialLink[];
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
    imagesGallery: string[];
  };
}

export interface IListGamesFilters {
  list: 'latest' | 'popular' | 'random';
  search?: string;
  page?: number;
  user?: string;
}
