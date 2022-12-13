import { AssetType } from '../../assets/types/assets';

export enum AssetQueue {
  Avatars = 'avatars',
  Items = 'items',
  Gems = 'gems',
}

export enum LegacyQueue {
  Avatars = 'avatars-legacy',
  Items = 'items-legacy',
  Gems = 'gems-legacy',
}

export enum AssetEvent {
  Create = 'create-asset',
  Transfer = 'transfer-asset',
}

export type AssetPayload = {
  assetType: AssetType;
  from: string;
  to: string;
  tokenId: string;
  transactionHash: string;
};

export type LegacyPayload = {
  assetType: AssetType;
  tokenId: string;
  legacyEventsAmount: number;
};
