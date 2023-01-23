export default () => ({
  port: parseInt(process.env.PORT, 10),
  redis: {
    uri: process.env.REDIS_STORAGE_URI,
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DATABASE,
  },
  aws: {
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3: {
      endpoint: process.env.AWS_S3_ENDPOINT,
      bucket: process.env.AWS_S3_BUCKET,
      endpointCore: process.env.AWS_CORE_S3_ENDPOINT,
      bucketCore: process.env.AWS_CORE_S3_BUCKET,
    },
  },
  provider: {
    rpc: process.env.PROVIDER_RPC,
    assets: {
      avatar: process.env.ASSETS_AVATAR_CONTRACT,
      item: process.env.ASSETS_ITEM_CONTRACT,
      gem: process.env.ASSETS_GEM_CONTRACT,
    },
    legacy: {
      avatar: process.env.AVATAR_LEGACY_CONTRACT,
      item: process.env.ASSET_LEGACY_CONTRACT,
      gem: process.env.GEM_LEGACY_CONTRACT,
      game: '',
    },
    gameDirectory: {
      endpoint: process.env.GAME_DIRECTORY_ENDPOINT,
      contract: process.env.GAME_DIRECTORY_CONTRACT,
    },
  },
  payment: {
    liqpay: {
      private: process.env.LIQPAY_PRIVATE_KEY,
      public: process.env.LIQPAY_PUB_KEY,
      endpoint: process.env.LIQPAY_ENDPOINT,
    },
    stripe: {
      private: process.env.STRIPE_PRIVATE_KEY,
      public: process.env.STRIPE_PUB_KEY,
    },
    paymentMethod: process.env.PAYMENT_METHOD,
    gem: process.env.GEM_DEFAULT_PRICE,
    item: process.env.ITEM_DEFAULT_PRICE,
    avatar: process.env.AVATAR_DEFAULT_PRICE,
    endpoint: process.env.PAYMENT_ENDPOINT,
  },
});
