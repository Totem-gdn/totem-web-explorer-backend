export interface AssetRecord {
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

export interface AssetResponse {
  data: AssetRecord[];
  meta: {
    total: number;
    page: number;
    perPage: number;
  };
}

export interface AssetMetadata {
  all: number;
  rare: number;
  unique: number;
}
