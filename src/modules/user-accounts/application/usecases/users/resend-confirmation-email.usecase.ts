import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { ConfirmationCodeResentEvent } from '../../../domain/events/confirmation-code-resent.event';
import { CONFIRMATION_CODE_LIFETIME_MS } from '../../../constants/auth-codes.constants';
import {
  DomainException,
  Extension,
} from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class ResendConfirmationEmailCommand {
  constructor(public email: string) {}
}

@CommandHandler(ResendConfirmationEmailCommand)
export class ResendConfirmationEmailUseCase implements ICommandHandler<
  ResendConfirmationEmailCommand,
  void
> {
  constructor(
    private eventBus: EventBus,
    private usersRepository: UsersRepository,
  ) {}

  async execute({ email }: ResendConfirmationEmailCommand): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with this email not found',
        extensions: [new Extension('user with this email not found', 'email')],
      });
    }

    if (user.isEmailConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email is already confirmed',
        extensions: [new Extension('email is already confirmed', 'email')],
      });
    }

    //каждый раз новый код, старый перестает работать
    const confirmCode = randomUUID();
    user.setConfirmationCode(confirmCode, CONFIRMATION_CODE_LIFETIME_MS);

    await this.usersRepository.save(user);

    this.eventBus.publish(
      new ConfirmationCodeResentEvent(user.email, confirmCode),
    );
  }
}
