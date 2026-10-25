import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PasswordRecoveryRequestedEvent } from '../../../user-accounts/domain/events/password-recovery-requested.event';
import { EmailService } from '../../email.service';

// https://docs.nestjs.com/recipes/cqrs#events
@EventsHandler(PasswordRecoveryRequestedEvent)
export class SendPasswordRecoveryEmailEventHandler implements IEventHandler<PasswordRecoveryRequestedEvent> {
  constructor(private emailService: EmailService) {}

  async handle(event: PasswordRecoveryRequestedEvent) {
    // Ошибки в EventHandlers не могут быть пойманы фильтрами исключений:
    // необходимо обрабатывать вручную
    try {
      await this.emailService.sendPasswordRecoveryEmail(
        event.email,
        event.recoveryCode,
      );
    } catch (e) {
      console.error('send password recovery email', e);
    }
  }
}
