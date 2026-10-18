import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendConfirmationEmail(email: string, code: string): Promise<void> {
    //код подтверждения передаем в ссылке как query параметр (требование swagger)
    await this.mailerService.sendMail({
      to: email,
      subject: 'Registration confirmation',
      html: `<h1>Thank for your registration</h1>
 <p>To finish registration please follow the link below:
     <a href='https://some-front.com/confirm-registration?code=${code}'>complete registration</a>
 </p>`,
    });
  }

  async sendPasswordRecoveryEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password recovery',
      html: `<h1>Password recovery</h1>
 <p>To finish password recovery please follow the link below:
     <a href='https://some-front.com/password-recovery?recoveryCode=${code}'>recovery password</a>
 </p>`,
    });
  }
}
