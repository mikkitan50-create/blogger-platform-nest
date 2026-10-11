//dto для сервиса (application слой)
export class CreateUserDto {
  login: string;
  email: string;
  password: string;
}