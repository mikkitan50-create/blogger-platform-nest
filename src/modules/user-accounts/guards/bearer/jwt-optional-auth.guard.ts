import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserContextDto } from '../dto/user-context.dto';

//для публичных GET запросов: если токен есть и он валидный - достаем юзера (нужен для myStatus),
//если токена нет или он протух - не блокируем запрос, юзер просто будет null
//https://docs.nestjs.com/recipes/passport#extending-guards
@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = UserContextDto>(
    err: unknown,
    user: TUser,
  ): TUser | null {
    // базовый метод кидает ошибку, если нет юзера, а мы просто вернем null
    if (err || !user) {
      return null;
    }

    return user;
  }
}
