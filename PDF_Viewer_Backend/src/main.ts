import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/Interceptor/response.interceptor';
import { useContainer } from 'class-validator';
import * as bodyParser from 'body-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ResponseInterceptor());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: 'localhost',
      port: 6379,
    },
  });
  
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'send_email',
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.setGlobalPrefix('api', { exclude: [''] });

  // Bật CORS
  app.enableCors({
    origin: process.env.FE_URI,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, If-Modified-Since',
    credentials: true,
  });

  if (port === undefined) {
    throw new Error('PORT configuration is not set');
  }

  await app.listen(port);
}
bootstrap();
