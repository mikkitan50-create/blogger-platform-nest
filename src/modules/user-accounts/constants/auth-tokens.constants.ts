//настройки access токена
//TODO: move to ConfigModule. will be in the following lessons
export const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || 'access-token-secret';

//по заданию время жизни access токена не менее 5 минут
export const ACCESS_TOKEN_EXPIRES_IN = '5m';
