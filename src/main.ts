import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { exec } from 'child_process';

async function seedDatabase() {
  console.log('🌱 Running database seed...');
  return new Promise<void>((resolve, reject) => {
    exec('npx prisma db seed', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Database seeding failed:', stderr || error.message);
        reject(error);
      } else {
        console.log('✅ Database seeding completed.');
        resolve();
      }
    });
  });
}

async function bootstrap() {
  await seedDatabase(); // Run seeding before starting the app
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
