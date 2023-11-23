import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as helmet from 'helmet';

import { AppModule } from './modules/app.module';

async function bootstrap() {
  const logger = new Logger(bootstrap.name);
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      abortOnError: false,
      cors: true,
    });
    app.use(helmet());
    app.useWebSocketAdapter(new IoAdapter(app));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    const configService = app.get(ConfigService);
    const port = configService.get<number>('port');
    const debug = configService.get<boolean>('debug');

    const config = new DocumentBuilder()
      .setTitle('HTN API')
      .setDescription('HTN Coach API documentation')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document, {});

    await app.listen(port);
    if (debug) {
      logger.debug('Running in debug mode');
    }
    logger.log(`HTN backend is running on ${await app.getUrl()}`);
  } catch (error) {
    logger.error(error);
  }
}

bootstrap();
