import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserRegisteredEvent } from '../../../user-accounts/domain/events/user-registered.event';
import { ConfirmationCodeResentEvent } from '../../../user-accounts/domain/events/confirmation-code-resent.event';
import { EmailService } from '../../email.service';

//письмо с кодом подтверждения отправляем и после регистрации, и при повторном запросе кода
// https://docs.nestjs.com/recipes/cqrs#events
@EventsHandler(UserRegisteredEvent, ConfirmationCodeResentEvent)
export class SendConfirmationEmailEventHandler implements IEventHandler<
  UserRegisteredEvent | ConfirmationCodeResentEvent
> {
  constructor(private emailService: EmailService) {}

  async handle(event: UserRegisteredEvent | ConfirmationCodeResentEvent) {
    // Ошибки в EventHandlers не могут быть пойманы фильтрами исключений:
    // необходимо обрабатывать вручную
    try {
      await this.emailService.sendConfirmationEmail(
        event.email,
        event.confirmationCode,
      );
    } catch (e) {
      console.error('send confirmation email', e);
    }
  }
}
