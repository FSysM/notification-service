import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'notification-service',
        brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
      },
      consumer: {
        groupId: 'notification-service-group',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3004);
}
bootstrap();
