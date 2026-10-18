import { IsString, Matches } from 'class-validator';
import { emailConstraints } from '../../domain/user.entity';
import { Trim } from '../../../../core/decorators/transform/trim';

//dto для боди при запросе восстановления пароля (POST /auth/password-recovery)
export class PasswordRecoveryInputDto {
  @IsString()
  @Matches(emailConstraints.match)
  @Trim()
  email: string;
}
