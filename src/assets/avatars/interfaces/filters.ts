export interface ListAvatarsFilters {
  list: 'popular' | 'latest' | 'my';
  page?: number;
  gameId?: string;
  user?: string;
  search?: string;
}
