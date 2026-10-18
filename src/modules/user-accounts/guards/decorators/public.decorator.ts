import { SetMetadata } from '@nestjs/common';

//помечаем публичные эндпоинты, которые BasicAuthGuard должен пропускать без проверки
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
