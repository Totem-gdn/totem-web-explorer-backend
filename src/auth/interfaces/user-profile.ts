export interface IProfileResponse {
  welcomeTokens?: number;
  items?: {
    all: number;
    rare: number;
    unique: number;
  };
  avatars?: {
    all: number;
    rare: number;
    unique: number;
  };
  gems?: {
    all: number;
    rare: number;
    unique: number;
  };
}
