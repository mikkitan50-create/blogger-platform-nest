import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../../dto/create-user.dto';
import { CryptoService } from '../services/crypto.service';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { UsersRepository } from '../../infrastructure/users.repository';
import {
  DomainException,
  Extension,
} from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

//общая часть создания юзера для админки и для регистрации
@Injectable()
export class UsersFactory {
  // ❌ не храним состояние в свойствах (например passwordHash): фабрика синглтон,
  // между разными запросами данные могут перезаписаться

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly usersRepository: UsersRepository,
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    await this.checkLoginAndEmailAreUnique(dto);

    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.password,
    );

    return this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
    });
  }

  //ошибка уникальности отдается одним элементом (не смешиваем с ошибками валидации)
  private async checkLoginAndEmailAreUnique(dto: CreateUserDto) {
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
  }
}
