import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from '../../dto/user-context.dto';

//используем вместе с JwtOptionalAuthGuard: юзера может и не быть (анонимный запрос)
export const ExtractUserIfExistsFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto | null => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: UserContextDto | null }>();

    const user = request.user;

    if (!user) {
      return null;
    }

    return user;
  },
);
