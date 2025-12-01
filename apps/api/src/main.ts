import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { LoggerService, envs } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      bodyLimit: 10485760, // 10MB
    }),
    {
      bufferLogs: true,
      rawBody: true, // Para Better Auth
    }
  );

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  await app.register(helmet, {
    contentSecurityPolicy: envs.nodeEnv === 'development' ? false : undefined,
  });

  app.enableCors({
    origin: envs.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  app.setGlobalPrefix('api', {
    exclude: ['/health'],
  });

  process.on('SIGTERM', () => {
    void (async () => {
      logger.log('Señal SIGTERM recibida, cerrando la aplicación de forma ordenada', 'Bootstrap');
      await app.close();
      process.exit(0);
    })();
  });

  process.on('SIGINT', () => {
    void (async () => {
      logger.log('Señal SIGINT recibida, cerrando la aplicación de forma ordenada', 'Bootstrap');
      await app.close();
      process.exit(0);
    })();
  });

  const port = envs.port || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Aplicación escuchando en el puerto ${port}`, 'Bootstrap');
  logger.log(`Entorno: ${envs.nodeEnv}`, 'Bootstrap');
  logger.log(`URL Backend Pública: ${envs.backendUrl ?? 'http://localhost:' + port}`, 'Bootstrap');
}

bootstrap().catch(error => {
  console.error('Error al iniciar la aplicación:', error);
  process.exit(1);
});
