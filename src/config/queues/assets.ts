import { AssetType } from '../../assets/types/assets';

export enum AssetQueue {
  Avatars = 'avatars',
  Items = 'items',
  Gems = 'gems',
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
