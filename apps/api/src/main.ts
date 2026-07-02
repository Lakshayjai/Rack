import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { LOCAL_UPLOAD_DIR } from './upload/upload.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // All routes are namespaced under /api to match the frontend contract.
  app.setGlobalPrefix('api');

  // Serve locally-stored images (used when Cloudinary is not configured) at /uploads.
  app.useStaticAssets(LOCAL_UPLOAD_DIR, { prefix: '/uploads' });

  app.use(cookieParser());

  // Strip unknown properties and coerce DTO types on every request.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // Lock CORS to the web origin and allow credentialed (cookie) requests.
  app.enableCors({
    origin: config.get<string>('webOrigin'),
    credentials: true,
  });

  const port = config.get<number>('port') ?? 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api`);
}
void bootstrap();
