//file đầu tiên chạy tiên hệ thống. nhớ thế nestjs mới có thể chạy
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';

// main.ts
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      // exceptionFactory: (validationErrors: ValidationError[] = []) => {
      //   return new BadRequestException(
      //     validationErrors.map((error) => ({
      //       [error.property]: error.constraints
      //         ? Object.values(error.constraints)[0]
      //         : '',
      //     })),
      //   );
      // },
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Nest ex')
    .setDescription('Swagger api')
    .setVersion('1.0')
    .addTag('Users')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.setGlobalPrefix('api', { exclude: [''] }); // route xuất phát với tiền tố api và trang chủ (root) thì không cần prefix api
  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>('PORT'));
  await app.listen(port);
}

void bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
