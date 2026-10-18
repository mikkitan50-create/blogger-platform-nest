import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { UsersRepository } from '../infrastructure/users.repository';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { CryptoService } from './crypto.service';
import { CONFIRMATION_CODE_LIFETIME_MS } from './users.service';
import { EmailService } from '../../notifications/email.service';
import { NewPasswordDto } from '../dto/create-user.dto';
import {
  DomainException,
  Extension,
} from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

//время жизни кода восстановления пароля
const RECOVERY_CODE_LIFETIME_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private emailService: EmailService,
  ) {}

  //вызывается из LocalStrategy: проверяем логин (или email) и пароль
  async validateUser(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.cryptoService.comparePasswords({
      password,
      hash: user.passwordHash,
    });

    if (!isPasswordValid) {
      return null;
    }

    return { id: user._id.toString() };
  }

  login(userId: string): { accessToken: string } {
    const payload: UserContextDto = { id: userId };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
    };
  }

  async confirmRegistration(code: string): Promise<void> {
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

  async resendConfirmationEmail(email: string): Promise<void> {
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

    this.emailService
      .sendConfirmationEmail(user.email, confirmCode)
      .catch(console.error);
  }

  async passwordRecovery(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    //если email не зарегистрирован, все равно отвечаем 204 (чтобы нельзя было узнать чужие email)
    if (!user) {
      return;
    }

    const recoveryCode = randomUUID();
    user.setPasswordRecoveryCode(recoveryCode, RECOVERY_CODE_LIFETIME_MS);

    await this.usersRepository.save(user);

    this.emailService
      .sendPasswordRecoveryEmail(user.email, recoveryCode)
      .catch(console.error);
  }

  async newPassword(dto: NewPasswordDto): Promise<void> {
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
