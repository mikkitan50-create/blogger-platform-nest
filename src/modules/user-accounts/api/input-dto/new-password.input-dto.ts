import { IsNotEmpty, IsString, Length } from 'class-validator';
import { NewPasswordDto } from '../../dto/create-user.dto';
import { passwordConstraints } from '../../domain/user.entity';
import { Trim } from '../../../../core/decorators/transform/trim';

//dto для боди при смене пароля (POST /auth/new-password)
export class NewPasswordInputDto implements NewPasswordDto {
  @IsString()
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
  @Trim()
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @Trim()
  recoveryCode: string;
}
