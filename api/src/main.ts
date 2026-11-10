import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/exception.filter';
import { AppLogger } from './common/logger';
import { loadConfig } from './config/env';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const adapter = new FastifyAdapter({ trustProxy: true, bodyLimit: 1_048_576 });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: false,
  });

  await app.register(fastifyCookie as never);
  await app.register(fastifyHelmet as never, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  app.enableCors({
    origin: config.webOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    maxAge: 600,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AppExceptionFilter());
  app.enableShutdownHooks();

  await app.listen({ port: config.port, host: '0.0.0.0' });
  AppLogger.log(`API escuchando en http://localhost:${config.port}/api/v1`);
}

bootstrap().catch((error) => {
  AppLogger.error(error instanceof Error ? error.message : String(error), 'Bootstrap');
  process.exitCode = 1;
});
