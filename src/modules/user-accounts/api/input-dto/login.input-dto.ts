import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';

//dto для боди при логине (POST /auth/login)
//валидируется в LocalAuthGuard, т.к. guard срабатывает раньше пайпов
export class LoginInputDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  loginOrEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
