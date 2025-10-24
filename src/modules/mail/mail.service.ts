import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { MailQueueName } from './queue.name';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue(MailQueueName.EMAIL)
    private readonly mailQueue: Queue,
  ) {}
  async sendEmailForgotPassword(
    to: string,
    name: string,
    resetCode: string,
    language: 'vn' | 'en',
  ) {
    await this.mailQueue.add('send-email', {
      to,
      name,
      resetCode,
      language,
      type: 'forgot-password',
    });
  }

  async sendEmailChangeEmail(
    to: string,
    name: string,
    link: string,
    language: 'vn' | 'en',
  ) {
    await this.mailQueue.add('send-email', {
      to,
      name,
      link,
      language,
      type: 'change-email',
    });
  }
}
