import { IsString, Length, Matches } from 'class-validator';
import { CreateUserDto } from '../../dto/create-user.dto';
import {
  emailConstraints,
  loginConstraints,
  passwordConstraints,
} from '../../domain/user.entity';
import { Trim } from '../../../../core/decorators/transform/trim';
import { IsStringWithTrim } from '../../../../core/decorators/validation/is-string-with-trim';

// Доступные декораторы для валидации
// https://github.com/typestack/class-validator?tab=readme-ov-file#validation-decorators

//dto для боди при создании юзера (POST /users и POST /auth/registration)
export class CreateUserInputDto implements CreateUserDto {
  @IsStringWithTrim(loginConstraints.minLength, loginConstraints.maxLength)
  @Matches(loginConstraints.match)
  login: string;

  @IsString()
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
  @Trim()
  password: string;

  @IsString()
  @Matches(emailConstraints.match)
  @Trim()
  email: string;
}
