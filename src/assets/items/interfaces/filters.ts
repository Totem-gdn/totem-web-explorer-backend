export interface ListItemsFilter {
  list: 'popular' | 'latest' | 'my';
  page?: number;
  gameId?: string;
  user?: string;
}
