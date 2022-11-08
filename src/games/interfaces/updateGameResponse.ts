export interface UpdateGameResponse {
  id: string;
  connections?: {
    dnaFilters?: {
      avatarFilter?: string;
      assetFilter?: string;
      gemFilter?: string;
    };
  };
  uploadImageURLs?: {
    coverImage?: string;
    cardThumbnail?: string;
    smallThumbnail?: string;
    imagesGallery?: string[];
  };
}
