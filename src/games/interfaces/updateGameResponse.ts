export interface UpdateGameResponse {
  id: string;
  connections?: {
    dnaFilter: string;
  };
  uploadImageURLs?: {
    coverImage?: string;
    cardThumbnail?: string;
    smallThumbnail?: string;
    imagesGallery?: string[];
  };
}
