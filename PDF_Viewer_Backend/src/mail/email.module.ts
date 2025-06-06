import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailConsumer } from './email.consumer';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'send_email',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [EmailConsumer],
  providers: [EmailConsumer],
  exports: [ClientsModule],
})
export class EmailModule {}
