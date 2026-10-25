//пользователь запросил восстановление пароля, нужно отправить письмо с кодом
export class PasswordRecoveryRequestedEvent {
  constructor(
    public readonly email: string,
    public readonly recoveryCode: string,
  ) {}
}
