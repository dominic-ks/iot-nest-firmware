import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppController } from './app.controller';

async function bootstrap() {
  const app = await NestFactory.create( AppModule );
  //const appController = app.get( AppController );
}

bootstrap();
