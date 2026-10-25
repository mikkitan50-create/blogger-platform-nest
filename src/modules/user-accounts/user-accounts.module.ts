import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserSchema } from './domain/user.entity';
import { UsersController } from './api/users.controller';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/services/auth.service';
import { CryptoService } from './application/services/crypto.service';
import { UsersFactory } from './application/factories/users.factory';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { UsersExternalQueryRepository } from './infrastructure/external-query/users.external-query-repository';
import { LocalStrategy } from './guards/local/local.strategy';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { NotificationsModule } from '../notifications/notifications.module';
import { CreateUserUseCase } from './application/usecases/admins/create-user.usecase';
import { DeleteUserUseCase } from './application/usecases/admins/delete-user.usecase';
import { RegisterUserUseCase } from './application/usecases/users/register-user.usecase';
import { ConfirmRegistrationUseCase } from './application/usecases/users/confirm-registration.usecase';
import { ResendConfirmationEmailUseCase } from './application/usecases/users/resend-confirmation-email.usecase';
import { PasswordRecoveryUseCase } from './application/usecases/users/password-recovery.usecase';
import { NewPasswordUseCase } from './application/usecases/users/new-password.usecase';
import { LoginUserUseCase } from './application/usecases/login-user.usecase';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants/auth-tokens.inject-constants';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_SECRET,
} from './constants/auth-tokens.constants';

const commandHandlers = [
  CreateUserUseCase,
  DeleteUserUseCase,
  RegisterUserUseCase,
  ConfirmRegistrationUseCase,
  ResendConfirmationEmailUseCase,
  PasswordRecoveryUseCase,
  NewPasswordUseCase,
  LoginUserUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationsModule,
  ],
  controllers: [UsersController, AuthController],
  providers: [
    ...commandHandlers,
    UsersFactory,
    UsersRepository,
    UsersQueryRepository,
    AuthQueryRepository,
    UsersExternalQueryRepository,
    AuthService,
    CryptoService,
    LocalStrategy,
    JwtStrategy,
    //один и тот же класс JwtService регистрируем два раза с разными настройками (через токены)
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (): JwtService => {
        return new JwtService({
          secret: ACCESS_TOKEN_SECRET,
          signOptions: { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
        });
      },
      inject: [
        /*TODO: inject configService. will be in the following lessons*/
      ],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (): JwtService => {
        return new JwtService({
          secret: REFRESH_TOKEN_SECRET,
          signOptions: { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
        });
      },
      inject: [
        /*TODO: inject configService. will be in the following lessons*/
      ],
    },
  ],
  //для bloggers-platform: проверка токена (guards) и данные юзера (логин автора комментария, лайка)
  exports: [JwtStrategy, UsersExternalQueryRepository],
})
export class UserAccountsModule {}
