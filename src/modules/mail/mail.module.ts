import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailQueueName } from './queue.name';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailProcessor } from './mail.processor';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('BULLMQ_REDIS_HOST'),
          port: Number(configService.get<string>('BULLMQ_REDIS_PORT')),
        },
      }),
    }),

    // Đăng ký queue
    BullModule.registerQueue({
      name: MailQueueName.EMAIL,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host:
            configService.get<string>('MAILDEV_INCOMING_HOST') || 'localhost',
          port:
            Number(configService.get<string>('MAILDEV_INCOMING_PORT')) || 1025,
          secure: false,
        },
        defaults: {
          from: '"No Reply" <no-reply@localhost>',
        },
        template: {
          dir: join(process.cwd(), 'src', 'modules', 'mail', 'template'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    // MailerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     transport: {
    //       host: configService.get<string>('MAILDEV_INCOMING_HOST'),
    //       port: Number(configService.get<string>('MAILDEV_INCOMING_PORT')),
    //       // ignoreTLS: true,
    //       secure: true,
    //       auth: {
    //         user: configService.get<string>('MAILDEV_INCOMING_USER'),
    //         pass: configService.get<string>('MAILDEV_INCOMING_PASS'),
    //       },
    //     },
    //     defaults: {
    //       from: '"No Reply" <no-reply@localhost>',
    //     },
    //     // preview: true,
    //     template: {
    //       dir: join(process.cwd(), 'src', 'modules', 'mail', 'template'),
    //       adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
    //       options: {
    //         strict: true,
    //       },
    //     },
    //   }),
    // }),
  ],
  providers: [MailService, MailProcessor],
  exports: [BullModule, MailService],
})
export class MailModule {}
