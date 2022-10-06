export enum AssetQueue {
  Avatars = 'avatars',
  Items = 'items',
  Gems = 'gems',
}

export enum AssetEvent {
  Create = 'create-asset',
  Transfer = 'transfer-asset',
}

export type AssetType = 'avatar' | 'item' | 'gem';

export type AssetPayload = {
  assetType: AssetType;
  from: string;
  to: string;
  tokenId: string;
  transactionHash: string;
};
