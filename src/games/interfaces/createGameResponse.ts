export interface CreateGameResponse {
  id: string;
  uploadImageURLs: {
    coverImage: string;
    cardThumbnail: string;
    smallThumbnail: string;
    imagesGallery: string[];
  };
}
