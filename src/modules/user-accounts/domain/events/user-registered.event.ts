//после регистрации нужно отправить письмо с кодом подтверждения
export class UserRegisteredEvent {
  constructor(
    public readonly email: string,
    public readonly confirmationCode: string,
  ) {}
}
