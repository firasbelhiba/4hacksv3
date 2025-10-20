"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('4Hacks Backend API')
        .setDescription('Complete API documentation for the 4Hacks platform backend. ' +
        'This API provides endpoints for hackathon management, project submissions, ' +
        'AI-powered code analysis, automated judging, and real-time notifications.')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
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
//# sourceMappingURL=main.js.map