import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class UsersRepository {
  //инжектирование модели через DI
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async findById(id: string): Promise<UserDocument | null> {
    //id не в формате ObjectId -> mongoose кинет CastError (500), поэтому сразу null -> 404
    if (!isValidObjectId(id)) {
      return null;
    }

    return this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });
  }

  async save(user: UserDocument) {
    await user.save();
  }

  async findOrNotFoundFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }

    return user;
  }

  findByLogin(login: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ login, deletedAt: null });
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ email, deletedAt: null });
  }

  //для логина: пользователь может войти и по логину, и по email
  findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
      deletedAt: null,
    });
  }

  findByConfirmationCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ confirmationCode: code, deletedAt: null });
  }

  findByRecoveryCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ recoveryCode: code, deletedAt: null });
  }
}
