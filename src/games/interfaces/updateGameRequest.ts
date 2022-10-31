import { GameImage } from './gameImage';
import { SocialLink } from './socialLink';
import { DNAFilter } from './dnaFilter';

export interface UpdateGameRequest {
  general?: {
    name?: string;
    author?: string;
    description?: string;
    fullDescription?: string;
    genre?: string[];
  };
  details?: {
    status?: string;
    platforms?: string[];
    madeWith?: string;
    session?: string;
    languages?: string;
    inputs?: string;
  };
  images?: {
    coverImage?: GameImage;
    cardThumbnail?: GameImage;
    smallThumbnail?: GameImage;
    gallery?: GameImage[];
  };
  connections?: {
    webpage?: string;
    assetRenderer?: string;
    dnaFilter?: DNAFilter;
    promoVideo?: string;
    socialLinks?: SocialLink[];
  };
  contacts?: {
    email?: string;
    discord?: string;
  };
}
