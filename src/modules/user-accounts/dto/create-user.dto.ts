//dto для сервиса (application слой)
export class CreateUserDto {
  login: string;
  email: string;
  password: string;
}

//dto для смены пароля по коду восстановления
export class NewPasswordDto {
  newPassword: string;
  recoveryCode: string;
}
