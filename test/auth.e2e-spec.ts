import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { UsersTestManager } from './helpers/users-test-manager';
import { initSettings } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { delay } from './helpers/delay';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { EmailService } from '../src/modules/notifications/email.service';
import { ACCESS_TOKEN_SECRET } from '../src/modules/user-accounts/constants/auth-tokens.constants';

describe('auth', () => {
  let app: INestApplication;
  let userTestManger: UsersTestManager;
  let sendConfirmationEmail: jest.SpyInstance;
  let sendPasswordRecoveryEmail: jest.SpyInstance;

  const registrationBody = {
    login: 'login123',
    password: '123123123',
    email: 'email@email.em',
  };

  //код из последнего "отправленного" письма
  const getLastCode = (spy: jest.SpyInstance): string =>
    spy.mock.calls[spy.mock.calls.length - 1][1] as string;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    userTestManger = result.userTestManger;

    const emailService = app.get(EmailService);
    sendConfirmationEmail = jest.spyOn(emailService, 'sendConfirmationEmail');
    sendPasswordRecoveryEmail = jest.spyOn(
      emailService,
      'sendPasswordRecoveryEmail',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('registration', () => {
    beforeAll(async () => {
      await deleteAllData(app);
    });

    it('should register user and send email with code', async () => {
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration`)
        .send(registrationBody)
        .expect(HttpStatus.NO_CONTENT);

      expect(sendConfirmationEmail).toHaveBeenCalledWith(
        registrationBody.email,
        expect.any(String),
      );
    });

    it('should return 400 if login or email already exists', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration`)
        .send({ ...registrationBody, login: 'other' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(body).toEqual({
        errorsMessages: [{ message: expect.any(String), field: 'email' }],
      });
    });

    it('should resend email with new code and confirm registration', async () => {
      const firstCode = getLastCode(sendConfirmationEmail);

      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration-email-resending`)
        .send({ email: registrationBody.email })
        .expect(HttpStatus.NO_CONTENT);

      const newCode = getLastCode(sendConfirmationEmail);
      expect(newCode).not.toBe(firstCode);

      //старый код больше не работает
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
        .send({ code: firstCode })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
        .send({ code: newCode })
        .expect(HttpStatus.NO_CONTENT);

      //код уже применен
      const { body } = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
        .send({ code: newCode })
        .expect(HttpStatus.BAD_REQUEST);

      expect(body).toEqual({
        errorsMessages: [{ message: expect.any(String), field: 'code' }],
      });
    });

    it('should return 400 for resending if email is confirmed or not found', async () => {
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration-email-resending`)
        .send({ email: registrationBody.email })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration-email-resending`)
        .send({ email: 'unknown@email.em' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('login and me', () => {
    beforeAll(async () => {
      await deleteAllData(app);
      await userTestManger.createUser(registrationBody);
    });

    it('should login by login and by email', async () => {
      const byLogin = await userTestManger.login(
        registrationBody.login,
        registrationBody.password,
      );
      expect(byLogin).toEqual({ accessToken: expect.any(String) });

      const byEmail = await userTestManger.login(
        registrationBody.email,
        registrationBody.password,
      );
      expect(byEmail).toEqual({ accessToken: expect.any(String) });
    });

    it('should return 401 for wrong password and 400 for incorrect input', async () => {
      await userTestManger.login(
        registrationBody.login,
        'wrong-password',
        HttpStatus.UNAUTHORIZED,
      );

      const { body } = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({ loginOrEmail: 123 })
        .expect(HttpStatus.BAD_REQUEST);

      expect(body).toEqual({
        errorsMessages: [
          { message: expect.any(String), field: 'loginOrEmail' },
          { message: expect.any(String), field: 'password' },
        ],
      });
    });

    it('should return user info for "me" request', async () => {
      const { accessToken } = await userTestManger.login(
        registrationBody.login,
        registrationBody.password,
      );

      const responseBody = await userTestManger.me(accessToken);

      expect(responseBody).toEqual({
        login: registrationBody.login,
        email: registrationBody.email,
        userId: expect.any(String),
      });

      await userTestManger.me('wrong-token', HttpStatus.UNAUTHORIZED);
    });
  });

  describe('password recovery', () => {
    beforeAll(async () => {
      await deleteAllData(app);
      await userTestManger.createUser(registrationBody);
    });

    it('should return 204 even if email is not registered and 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/password-recovery`)
        .send({ email: 'unknown@email.em' })
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/password-recovery`)
        .send({ email: '222^gmail.com' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should set new password by recovery code', async () => {
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/password-recovery`)
        .send({ email: registrationBody.email })
        .expect(HttpStatus.NO_CONTENT);

      const recoveryCode = getLastCode(sendPasswordRecoveryEmail);

      //короткий пароль
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/new-password`)
        .send({ newPassword: '123', recoveryCode })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/new-password`)
        .send({ newPassword: 'newpassword', recoveryCode })
        .expect(HttpStatus.NO_CONTENT);

      //код одноразовый
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/new-password`)
        .send({ newPassword: 'newpassword2', recoveryCode })
        .expect(HttpStatus.BAD_REQUEST);

      await userTestManger.login(
        registrationBody.login,
        registrationBody.password,
        HttpStatus.UNAUTHORIZED,
      );
      await userTestManger.login(registrationBody.login, 'newpassword');
    });
  });
});

describe('auth (expired access token)', () => {
  let app: INestApplication;
  let userTestManger: UsersTestManager;

  beforeAll(async () => {
    //подменяем JwtService, чтобы токен жил 2 секунды
    const result = await initSettings((moduleBuilder) =>
      moduleBuilder.overrideProvider(JwtService).useValue(
        new JwtService({
          secret: ACCESS_TOKEN_SECRET,
          signOptions: { expiresIn: '2s' },
        }),
      ),
    );
    app = result.app;
    userTestManger = result.userTestManger;
  });

  afterAll(async () => {
    await app.close();
  });

  it(`shouldn't return users info while "me" request if accessToken expired`, async () => {
    const tokens = await userTestManger.createAndLoginSeveralUsers(1);
    await delay(2000);
    await userTestManger.me(tokens[0].accessToken, HttpStatus.UNAUTHORIZED);
  });
});
