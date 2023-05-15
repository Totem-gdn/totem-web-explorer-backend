export interface ListGamesFilters {
  list: 'latest' | 'popular' | 'random';
  search?: string;
  page?: number;
  user?: string;
  approved?: boolean;
  hidden?: boolean;
  owner?: string;
  ids?: string[];
  released?: number;
}
