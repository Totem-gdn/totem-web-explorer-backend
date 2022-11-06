export interface DNAFilters {
  avatarFilter?: DNAFilter;
  assetFilter?: DNAFilter;
  gemFilter?: DNAFilter;
}

export interface DNAFilter {
  filename: string;
  mimeType: string;
  contentLength: number;
}
