import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginInputDto } from '../../api/input-dto/login.input-dto';
import { errorFormatter } from '../../../../setup/pipes.setup';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

//этот гард вешаем на логин. Через локальную стратегию проверяются логин и пароль пользователя
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    //guard срабатывает раньше ValidationPipe, поэтому body проверяем здесь,
    //чтобы на некорректные данные вернуть 400 (а не 401)
    const request = context.switchToHttp().getRequest<{ body?: object }>();
    const dto = plainToInstance(LoginInputDto, request.body ?? {});
    const errors = await validate(dto, { stopAtFirstError: true });

    if (errors.length) {
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Validation failed',
        extensions: errorFormatter(errors),
      });
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
