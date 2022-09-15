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
    }
  }
});
