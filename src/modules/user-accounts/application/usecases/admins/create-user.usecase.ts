import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserDto } from '../../../dto/create-user.dto';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { UsersFactory } from '../../factories/users.factory';

export class CreateUserCommand {
  constructor(public dto: CreateUserDto) {}
}

/**
 * Создание администратором пользователя через админскую панель (POST /users)
 */
@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<
  CreateUserCommand,
  string
> {
  constructor(
    private usersRepository: UsersRepository,
    private usersFactory: UsersFactory,
  ) {}

  async execute({ dto }: CreateUserCommand): Promise<string> {
    const user = await this.usersFactory.create(dto);

    //юзера создал админ, поэтому email сразу подтвержден
    user.confirmEmail();

    await this.usersRepository.save(user);

    return user._id.toString();
  }
}
