export interface IAvatarRecord {
  id: string;
  owner: string;
  owners: string[];
  tokenId: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  isLiked: boolean;
  likes: number;
  games: number;
  lastUsed: string;
}

export interface IListAvatarsFilters {
  list: 'popular' | 'latest' | 'my';
  page?: number;
  gameId?: string;
  user?: string;
}
