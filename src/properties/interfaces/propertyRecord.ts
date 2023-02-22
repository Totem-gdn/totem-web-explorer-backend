export interface PropertyRecord {
  key: string;
  value: string;
}

export interface PropertiesListResponse {
  meta: {
    pages: number;
    total: number;
    page: number;
  };
  data: PropertyRecord[];
}
