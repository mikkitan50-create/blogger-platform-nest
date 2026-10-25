import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId } from 'mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { UserExternalDto } from './external-dto/users.external-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

//репозиторий для других модулей (bloggers-platform), экспортируется из UserAccountsModule
@Injectable()
export class UsersExternalQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<UserExternalDto> {
    const user = isValidObjectId(id)
      ? await this.UserModel.findOne({ _id: id, deletedAt: null })
      : null;

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'user not found',
      });
    }

    return UserExternalDto.mapToView(user);
  }
}
