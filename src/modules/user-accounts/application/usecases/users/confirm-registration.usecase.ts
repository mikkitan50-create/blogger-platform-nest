import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import {
  DomainException,
  Extension,
} from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class ConfirmRegistrationCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmRegistrationCommand)
export class ConfirmRegistrationUseCase implements ICommandHandler<
  ConfirmRegistrationCommand,
  void
> {
  constructor(private usersRepository: UsersRepository) {}

  async execute({ code }: ConfirmRegistrationCommand): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(code);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Confirmation code is incorrect',
        extensions: [new Extension('confirmation code is incorrect', 'code')],
      });
    }

    if (user.isEmailConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email is already confirmed',
        extensions: [new Extension('email is already confirmed', 'code')],
      });
    }

    if (
      !user.confirmationCodeExpirationDate ||
      user.confirmationCodeExpirationDate < new Date()
    ) {
      throw new DomainException({
        code: DomainExceptionCode.ConfirmationCodeExpired,
        message: 'Confirmation code is expired',
        extensions: [new Extension('confirmation code is expired', 'code')],
      });
    }

    user.confirmEmail();

    await this.usersRepository.save(user);
  }
}
