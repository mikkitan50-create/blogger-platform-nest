import { EmailService } from '../../src/modules/notifications/email.service';

//в тестах письма реально не отправляем
export class EmailServiceMock extends EmailService {
  //override method
  sendConfirmationEmail(): Promise<void> {
    console.log('Call mock method sendConfirmationEmail / EmailServiceMock');

    return Promise.resolve();
  }

  //override method
  sendPasswordRecoveryEmail(): Promise<void> {
    console.log(
      'Call mock method sendPasswordRecoveryEmail / EmailServiceMock',
    );

    return Promise.resolve();
  }
}
