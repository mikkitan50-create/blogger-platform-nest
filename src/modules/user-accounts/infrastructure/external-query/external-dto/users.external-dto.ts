import { UserDocument } from '../../../domain/user.entity';

//данные юзера, которые нужны другим модулям (например логин автора комментария)
export class UserExternalDto {
  id: string;
  login: string;
  email: string;

  static mapToView(user: UserDocument): UserExternalDto {
    const dto = new UserExternalDto();

    dto.id = user._id.toString();
    dto.login = user.login;
    dto.email = user.email;

    return dto;
  }
}
