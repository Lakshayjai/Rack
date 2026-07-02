import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // All routes are namespaced under /api to match the frontend contract.
  app.setGlobalPrefix('api');

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
