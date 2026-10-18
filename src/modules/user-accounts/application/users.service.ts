import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersRepository } from '../infrastructure/users.repository';
import { CryptoService } from './crypto.service';
import { EmailService } from '../../notifications/email.service';
import {
  DomainException,
  Extension,
} from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

//время жизни кода подтверждения email
export const CONFIRMATION_CODE_LIFETIME_MS = 90 * 60 * 1000;

@Injectable()
export class UsersService {
  constructor(
    //инжектирование модели в сервис через DI
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
    private emailService: EmailService,
  ) {}

  //создание юзера админом (POST /users): email сразу подтвержден
  async createUser(dto: CreateUserDto): Promise<string> {
    const user = await this.createUserInstance(dto);

    user.confirmEmail();

    await this.usersRepository.save(user);

    return user._id.toString();
  }

  //регистрация (POST /auth/registration): email подтверждается кодом из письма
  async registerUser(dto: CreateUserDto): Promise<void> {
    const user = await this.createUserInstance(dto);

    const confirmCode = randomUUID();
    user.setConfirmationCode(confirmCode, CONFIRMATION_CODE_LIFETIME_MS);

    await this.usersRepository.save(user);

    //не ждем отправку письма, чтобы не задерживать ответ
    this.emailService
      .sendConfirmationEmail(user.email, confirmCode)
      .catch(console.error);
  }

  async deleteUser(id: string) {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.makeDeleted();

    await this.usersRepository.save(user);
  }

  //общая часть создания: проверка уникальности, хэш пароля, фабричный метод сущности
  private async createUserInstance(dto: CreateUserDto): Promise<UserDocument> {
    const userWithTheSameLogin = await this.usersRepository.findByLogin(
      dto.login,
    );
    if (userWithTheSameLogin) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with the same login already exists',
        extensions: [new Extension('login should be unique', 'login')],
      });
    }

    const userWithTheSameEmail = await this.usersRepository.findByEmail(
      dto.email,
    );
    if (userWithTheSameEmail) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with the same email already exists',
        extensions: [new Extension('email should be unique', 'email')],
      });
    }

    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.password,
    );

    return this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
    });
  }
}
