import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Next.js frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('4Hacks Backend API')
    .setDescription(
      'Complete API documentation for the 4Hacks platform backend. ' +
      'This API provides endpoints for hackathon management, project submissions, ' +
      'AI-powered code analysis, automated judging, and real-time notifications.'
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('Authentication', 'User registration, login, and authentication endpoints')
    .addTag('Hackathons', 'Hackathon CRUD operations and management')
    .addTag('Tracks', 'Hackathon track management')
    .addTag('Projects', 'Project submissions and management')
    .addTag('Reviews', 'AI-powered code reviews (Innovation, Coherence, Hedera)')
    .addTag('Code Quality', 'Code quality analysis and reporting')
    .addTag('Eligibility', 'Project eligibility validation')
    .addTag('AI Jury', 'Automated AI jury evaluation system')
    .addTag('Notifications', 'User notification management')
    .addTag('WebSocket', 'Real-time event subscriptions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: '4Hacks API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📡 API available at http://localhost:${port}/api`);
  console.log(`📚 Swagger documentation at http://localhost:${port}/api/docs`);
}

bootstrap();
