# totem-web-explorer-backend

# API Documentation available here: http://hostname/api

# Requirements:

- Node.JS version 16 or higher;
- Redis version 3.2 or higher;
- MongoDB version 4.2.8 of higher
- AWS

# Installing:

1. Install node modules

```sh
npm install
```

2. Copy .env.example to .env

```sh
cp .env.example .env
```

3. Fill .env file:

```sh
PORT= #port number which will be used
REDIS_STORAGE_URI= #url to Redis in format: redis://hostname:port/0
MONGODB_URI= #url to MongoDB in format: mongodb://hostname:port
MONGODB_DATABASE= #MongoDB database name. All tables will be created automatically
AWS_ACCESS_KEY_ID= #Key from AWS. Guide: https://docs.aws.amazon.com/powershell/latest/userguide/pstools-appendix-sign-up.html
AWS_SECRET_ACCESS_KEY= #Key from AWS. Guide: https://docs.aws.amazon.com/powershell/latest/userguide/pstools-appendix-sign-up.html
AWS_REGION= #AWS Region where created buckets from AWS console
AWS_S3_ENDPOINT= #AWS S3 Endpoint. Guide: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteEndpoints.html
AWS_S3_BUCKET= #AWS S3 Bucket. Guide: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteEndpoints.html
PROVIDER_RPC= #JSON RPC Polygon URL. Actual URLs here: https://wiki.polygon.technology/docs/develop/metamask/config-polygon-on-metamask/
ASSETS_AVATAR_CONTRACT= #Address of Totem Asset NFT smart contract
ASSETS_ITEM_CONTRACT= #Address of Totem Asset NFT smart contract
ASSETS_GEM_CONTRACT= #Address of Totem Asset NFT smart contract
```

4. Start the server

For production

```sh
npm run build && npm run start:prod
```

For development

```sh
npm run start:dev
```
