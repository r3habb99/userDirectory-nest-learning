import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import {
  API_CONFIG,
  DOCS_CONFIG,
  getBaseUrl,
  getApiBaseUrl,
} from './common/config/api.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable CORS for frontend integration
  app.enableCors({
    origin: process.env.FRONTEND_URL || API_CONFIG.DEFAULT_FRONTEND_URL,
    credentials: true,
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  // Set global prefix for all routes
  app.setGlobalPrefix(API_CONFIG.PREFIX);

  // Configure static file serving for uploads
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
    maxAge: 86400000, // 1 day cache
  });

  // Get port configuration
  const port = Number(process.env.PORT) || API_CONFIG.DEFAULT_PORT;

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle(DOCS_CONFIG.TITLE)
    .setDescription(DOCS_CONFIG.DESCRIPTION)
    .setVersion(API_CONFIG.VERSION)
    .setContact(
      DOCS_CONFIG.CONTACT.name,
      DOCS_CONFIG.CONTACT.url,
      DOCS_CONFIG.CONTACT.email,
    )
    .setLicense(DOCS_CONFIG.LICENSE.name, DOCS_CONFIG.LICENSE.url)
    .addServer(getBaseUrl(port), 'Local Development Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Admin authentication endpoints')
    .addTag('Students', 'Student management endpoints')
    .addTag('Courses', 'Course management endpoints')
    .addTag('Attendance', 'Attendance management endpoints')
    .addTag('ID Cards', 'ID card generation and management endpoints')
    .addTag('Admin Management', 'Admin user management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  });

  SwaggerModule.setup(DOCS_CONFIG.PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
    customSiteTitle: 'College Student Directory API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(port);

  logger.log(`🚀 Application is running on: ${getApiBaseUrl(port)}`);
  logger.log(`📚 API Documentation: ${getBaseUrl(port)}/${DOCS_CONFIG.PATH}`);
  logger.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});
