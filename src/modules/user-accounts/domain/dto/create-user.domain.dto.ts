//dto для фабричного метода сущности (domain слой)
export class CreateUserDomainDto {
  login: string;
  email: string;
  passwordHash: string;
}