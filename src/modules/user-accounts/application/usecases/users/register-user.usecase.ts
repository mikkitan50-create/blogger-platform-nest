import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { CreateUserDto } from '../../../dto/create-user.dto';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { UsersFactory } from '../../factories/users.factory';
import { UserRegisteredEvent } from '../../../domain/events/user-registered.event';
import { CONFIRMATION_CODE_LIFETIME_MS } from '../../../constants/auth-codes.constants';

export class RegisterUserCommand {
  constructor(public dto: CreateUserDto) {}
}

/**
 * Регистрация пользователя через email на странице регистрации сайта
 */
@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase implements ICommandHandler<
  RegisterUserCommand,
  void
> {
  constructor(
    private eventBus: EventBus,
    private usersRepository: UsersRepository,
    private usersFactory: UsersFactory,
  ) {}

  async execute({ dto }: RegisterUserCommand): Promise<void> {
    const user = await this.usersFactory.create(dto);

    const confirmCode = randomUUID();
    user.setConfirmationCode(confirmCode, CONFIRMATION_CODE_LIFETIME_MS);

    await this.usersRepository.save(user);

    //письмо отправит обработчик события в модуле notifications, ответ клиенту не ждет отправку
    this.eventBus.publish(new UserRegisteredEvent(user.email, confirmCode));
  }
}
