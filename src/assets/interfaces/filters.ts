export interface ListAssetsFilter {
  list: 'popular' | 'latest' | 'my';
  page?: number;
  gameId?: string;
  user?: string;
  search?: string;
  ids?: string[];
  owner?: string;
}
