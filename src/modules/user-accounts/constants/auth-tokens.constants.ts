//настройки access и refresh токенов
//TODO: move to ConfigModule. will be in the following lessons
export const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || 'access-token-secret';

//по заданию время жизни access токена не менее 5 минут
export const ACCESS_TOKEN_EXPIRES_IN = '5m';

export const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'refresh-token-secret';

//по swagger refresh токен живет 24 часа
export const REFRESH_TOKEN_EXPIRES_IN = '24h';
