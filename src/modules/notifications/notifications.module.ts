import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { SendConfirmationEmailEventHandler } from './application/event-handlers/send-confirmation-email.event-handler';
import { SendPasswordRecoveryEmailEventHandler } from './application/event-handlers/send-password-recovery-email.event-handler';

@Module({
  imports: [
    //почта отправляется через gmail (как в старом проекте), данные берем из .env
    //TODO: move to ConfigModule. will be in the following lessons
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
      defaults: {
        from:
          process.env.EMAIL_FROM || 'Blogger Platform <noreply@example.com>',
      },
    }),
  ],
  providers: [
    EmailService,
    SendConfirmationEmailEventHandler,
    SendPasswordRecoveryEmailEventHandler,
  ],
  exports: [EmailService],
})
export class NotificationsModule {}
