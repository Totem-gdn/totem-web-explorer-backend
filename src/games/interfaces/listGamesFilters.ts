export interface ListGamesFilters {
  list: 'latest' | 'popular' | 'random';
  search?: string;
  page?: number;
  user?: string;
  approved?: boolean;
}
