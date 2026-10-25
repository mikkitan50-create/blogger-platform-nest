import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constants/auth-tokens.inject-constants';

export class LoginUserCommand {
  constructor(public dto: { userId: string }) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<
  LoginUserCommand,
  { accessToken: string; refreshToken: string }
> {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
  ) {}

  async execute({
    dto,
  }: LoginUserCommand): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.accessTokenContext.signAsync({
      id: dto.userId,
    });

    //устройства (сессии) будут в следующих домашках, пока deviceId просто уникальная строка
    const refreshToken = await this.refreshTokenContext.signAsync({
      id: dto.userId,
      deviceId: randomUUID(),
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
