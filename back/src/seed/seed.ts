import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        const seedService = app.get(SeedService);
        await seedService.runSeed();
        console.log('Seed ejecutado correctamente');
    } catch (error) {
        console.error('Error ejecutando seed:', error);
        process.exitCode = 1;
    } finally {
        await app.close();
    }
}

void bootstrap();
