import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Orígenes permitidos: los locales y los que se definan en FRONTEND_URL
  // (varias URL separadas por coma) para los entornos desplegados.
  const origenesExtra = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      ...origenesExtra,
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger: documentación interactiva de la API en /api/docs
  const config = new DocumentBuilder()
    .setTitle('Talentify API')
    .setDescription(
      'API REST de Talentify: marketplace universitario de servicios freelance. ' +
        'Gestiona usuarios, servicios y órdenes con autenticación JWT.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addTag('Auth', 'Registro, inicio y cierre de sesión')
    .addTag('Users', 'Perfil propio y administración de usuarios')
    .addTag('Services', 'Publicación y gestión de servicios')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Servidor: http://localhost:${port}`);
  console.log(`📚 Swagger:  http://localhost:${port}/api/docs`);
}
bootstrap();
