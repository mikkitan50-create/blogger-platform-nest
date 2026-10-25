//пользователь запросил повторное письмо с новым кодом подтверждения
export class ConfirmationCodeResentEvent {
  constructor(
    public readonly email: string,
    public readonly confirmationCode: string,
  ) {}
}
