import { SocialLink } from './socialLink';

export interface GameRecord {
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
    dnaFilter: string;
    promoVideo: string;
    socialLinks: SocialLink[];
  };
  contacts: {
    email: string;
    discord: string;
  };
}