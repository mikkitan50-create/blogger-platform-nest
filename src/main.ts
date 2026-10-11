import 'dotenv/config'; //TODO: move to ConfigModule. will be in the following lessons
import dns from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';

//локальный DNS не отвечает на SRV-запросы mongodb+srv, используем DNS Google (как в старом проекте)
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  appSetup(app); //глобальные настройки приложения

  const PORT = process.env.PORT || 3000; //TODO: move to configService. will be in the following lessons

  await app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
  });
}
bootstrap();