import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { PasswordRecoveryRequestedEvent } from '../../../domain/events/password-recovery-requested.event';
import { RECOVERY_CODE_LIFETIME_MS } from '../../../constants/auth-codes.constants';

export class PasswordRecoveryCommand {
  constructor(public email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase implements ICommandHandler<
  PasswordRecoveryCommand,
  void
> {
  constructor(
    private eventBus: EventBus,
    private usersRepository: UsersRepository,
  ) {}

  async execute({ email }: PasswordRecoveryCommand): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    //если email не зарегистрирован, все равно отвечаем 204 (чтобы нельзя было узнать чужие email)
    if (!user) {
      return;
    }

    const recoveryCode = randomUUID();
    user.setPasswordRecoveryCode(recoveryCode, RECOVERY_CODE_LIFETIME_MS);

    await this.usersRepository.save(user);

    this.eventBus.publish(
      new PasswordRecoveryRequestedEvent(user.email, recoveryCode),
    );
  }
}
