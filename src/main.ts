import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// main.ts
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

void bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
