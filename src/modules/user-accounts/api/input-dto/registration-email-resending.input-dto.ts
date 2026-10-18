import { IsString, Matches } from 'class-validator';
import { emailConstraints } from '../../domain/user.entity';
import { Trim } from '../../../../core/decorators/transform/trim';

//dto для боди при повторной отправке письма (POST /auth/registration-email-resending)
export class RegistrationEmailResendingInputDto {
  @IsString()
  @Matches(emailConstraints.match)
  @Trim()
  email: string;
}
