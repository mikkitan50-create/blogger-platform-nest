import { INestApplication } from '@nestjs/common';

//префикс из swagger домашки: /hometask_15/api/...
export const GLOBAL_PREFIX = 'hometask_15/api';

export function globalPrefixSetup(app: INestApplication) {
  //специальный метод, который добавляет ко всем маршрутам /GLOBAL_PREFIX
  app.setGlobalPrefix(GLOBAL_PREFIX);
}
