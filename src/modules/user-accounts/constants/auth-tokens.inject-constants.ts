//токены для внедрения двух разных экземпляров JwtService (access и refresh)
export const ACCESS_TOKEN_STRATEGY_INJECT_TOKEN = Symbol(
  'ACCESS_TOKEN_STRATEGY_INJECT_TOKEN',
);
export const REFRESH_TOKEN_STRATEGY_INJECT_TOKEN = Symbol(
  'REFRESH_TOKEN_STRATEGY_INJECT_TOKEN',
);
