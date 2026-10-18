import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UsersTestManager } from './helpers/users-test-manager';
import { initSettings } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { PaginatedViewDto } from '../src/core/dto/base.paginated.view-dto';
import { UserViewDto } from '../src/modules/user-accounts/api/view-dto/users.view-dto';
import { CreateUserDto } from '../src/modules/user-accounts/dto/create-user.dto';

describe('users', () => {
  let app: INestApplication;
  let userTestManger: UsersTestManager;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    userTestManger = result.userTestManger;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('basic auth', () => {
    it('should return 401 without basic auth', async () => {
      await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/users`)
        .expect(HttpStatus.UNAUTHORIZED);

      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/users`)
        .send({ login: 'name1', password: 'qwerty', email: 'email@email.em' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 with wrong credentials', async () => {
      await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/users`)
        .auth('admin', 'wrong')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('create user', () => {
    it('should create user', async () => {
      const body: CreateUserDto = {
        login: 'name1',
        password: 'qwerty',
        email: 'email@email.em',
      };

      const response = await userTestManger.createUser(body);

      expect(response).toEqual({
        login: body.login,
        email: body.email,
        id: expect.any(String),
        createdAt: expect.any(String),
      });
    });

    it('should return 400 with errorsMessages for incorrect input', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/users`)
        .auth('admin', 'qwerty')
        .send({ login: 'a', password: '123', email: 'bad-email' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(body).toEqual({
        errorsMessages: expect.arrayContaining([
          { message: expect.any(String), field: 'login' },
          { message: expect.any(String), field: 'password' },
          { message: expect.any(String), field: 'email' },
        ]),
      });
      expect(body.errorsMessages).toHaveLength(3);
    });

    it('should return one error if login or email is not unique', async () => {
      await userTestManger.createUser({
        login: 'name1',
        password: 'qwerty',
        email: 'email@email.em',
      });

      const { body: loginError } = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/users`)
        .auth('admin', 'qwerty')
        .send({ login: 'name1', password: 'qwerty', email: 'other@email.em' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(loginError).toEqual({
        errorsMessages: [{ message: expect.any(String), field: 'login' }],
      });

      const { body: emailError } = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/users`)
        .auth('admin', 'qwerty')
        .send({ login: 'name2', password: 'qwerty', email: 'email@email.em' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(emailError).toEqual({
        errorsMessages: [{ message: expect.any(String), field: 'email' }],
      });
    });
  });

  describe('get and delete users', () => {
    it('should get users with paging and search', async () => {
      const users = await userTestManger.createSeveralUsers(12);
      const { body: responseBody } = (await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/users?pageNumber=2&sortDirection=asc`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK)) as { body: PaginatedViewDto<UserViewDto[]> };

      expect(responseBody.totalCount).toBe(12);
      expect(responseBody.items).toHaveLength(2);
      expect(responseBody.pagesCount).toBe(2);
      //asc sorting
      expect(responseBody.items[1]).toEqual(users[users.length - 1]);

      const { body: searchBody } = (await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/users?searchLoginTerm=T1&searchEmailTerm=st2@`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK)) as { body: PaginatedViewDto<UserViewDto[]> };

      //test1, test10, test11 (login) + test2 (email)
      expect(searchBody.totalCount).toBe(4);
    });

    it('should delete user and return 404 for not existing user', async () => {
      const user = await userTestManger.createUser({
        login: 'name1',
        password: 'qwerty',
        email: 'email@email.em',
      });

      await request(app.getHttpServer())
        .delete(`/${GLOBAL_PREFIX}/users/${user.id}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .delete(`/${GLOBAL_PREFIX}/users/${user.id}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NOT_FOUND);

      await request(app.getHttpServer())
        .delete(`/${GLOBAL_PREFIX}/users/not-object-id`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
