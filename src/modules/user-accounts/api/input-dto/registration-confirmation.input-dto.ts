import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';

//dto для боди при подтверждении регистрации (POST /auth/registration-confirmation)
export class RegistrationConfirmationCodeInputDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  code: string;
}
