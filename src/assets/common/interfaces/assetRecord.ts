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

export interface AssetMetadata {
  all: number;
  rare: number;
  unique: number;
}
