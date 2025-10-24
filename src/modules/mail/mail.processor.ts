import { Processor, WorkerHost } from '@nestjs/bullmq';
import {
  MailQueueName,
  SubjectEMail,
  TemplateEMail,
  TitleEmail,
} from './queue.name';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';

interface MailJobData {
  to: string;
  name: string;
  resetCode?: string;
  link?: string;
  language?: 'vn' | 'en';
  type: 'forgot-password' | 'change-email';
}

@Processor(MailQueueName.EMAIL)
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailerService: MailerService) {
    super();
  }

  async process(job: Job<MailJobData>) {
    const { to, name, resetCode, link, language = 'vn', type } = job.data;
    const isVn = language === 'vn';

    try {
      switch (type) {
        case 'forgot-password': {
          const template = isVn
            ? TemplateEMail.VN_FORGOTPASSWORD
            : TemplateEMail.EN_FORGOTPASSWORD;
          const subject = isVn
            ? SubjectEMail.VN_FORGOTPASSWORD
            : SubjectEMail.EN_FORGOTPASSWORD;

          await this.mailerService.sendMail({
            to,
            subject: subject,
            template: template,
            context: {
              name: name,
              resetCode: resetCode,
            },
          });
          break;
        }

        case 'change-email': {
          const template = isVn
            ? TemplateEMail.VN_CHANGEEMAIL
            : TemplateEMail.EN_CHANGEEMAIL;
          const subject = isVn
            ? SubjectEMail.VN_CHANGEEMAIL
            : SubjectEMail.EN_CHANGEEMAIL;

          await this.mailerService.sendMail({
            to,
            subject: subject,
            template: template,
            context: {
              name: name,
              link: link,
            },
          });
          break;
        }

        default:
          console.error('❌ Unknown email type:', type);
      }
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}`, error);
    }
  }
}
