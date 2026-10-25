import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { CryptoService } from '../../services/crypto.service';
import { NewPasswordDto } from '../../../dto/create-user.dto';
import {
  DomainException,
  Extension,
} from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class NewPasswordCommand {
  constructor(public dto: NewPasswordDto) {}
}

@CommandHandler(NewPasswordCommand)
export class NewPasswordUseCase implements ICommandHandler<
  NewPasswordCommand,
  void
> {
  constructor(
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
  ) {}

  async execute({ dto }: NewPasswordCommand): Promise<void> {
    const user = await this.usersRepository.findByRecoveryCode(
      dto.recoveryCode,
    );

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Recovery code is incorrect',
        extensions: [
          new Extension('recovery code is incorrect', 'recoveryCode'),
        ],
      });
    }

    if (
      !user.recoveryCodeExpirationDate ||
      user.recoveryCodeExpirationDate < new Date()
    ) {
      throw new DomainException({
        code: DomainExceptionCode.PasswordRecoveryCodeExpired,
        message: 'Recovery code is expired',
        extensions: [new Extension('recovery code is expired', 'recoveryCode')],
      });
    }

    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.newPassword,
    );
    user.updatePassword(passwordHash);

    await this.usersRepository.save(user);
  }
}
