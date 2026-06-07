import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // FASE 5: seguridad y robustez en produccion
  app.use(helmet()); // cabeceras seguras
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina props no declaradas en DTO
      forbidNonWhitelisted: true, // rechaza props extra
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter()); // formato de error consistente
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend escuchando en http://localhost:${port}/api`);
}
bootstrap();
