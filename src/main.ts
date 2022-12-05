import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.enableCors({ origin: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Totem Web Explorer')
    .setDescription('Totem Web Explorer API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(config.get<number>('port'));
}

void bootstrap();
