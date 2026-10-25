import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initSettings } from './helpers/init-settings';
import { UsersTestManager } from './helpers/users-test-manager';
import { delay } from './helpers/delay';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';

describe('bloggers platform', () => {
  let app: INestApplication;
  let userTestManger: UsersTestManager;
  let tokens: { accessToken: string }[];
  let blogId: string;
  let postId: string;
  let commentId: string;

  const blogBody = {
    name: 'my blog',
    description: 'blog description',
    websiteUrl: 'https://my-blog.com',
  };

  const postBody = {
    title: 'post title',
    shortDescription: 'short description',
    content: 'post content',
  };

  const commentContent = 'this is a comment with 20+ chars';

  const server = () => request(app.getHttpServer());

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    userTestManger = result.userTestManger;

    tokens = await userTestManger.createAndLoginSeveralUsers(3);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('auth', () => {
    it('login should set refreshToken in http-only secure cookie', async () => {
      const response = await server()
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({ loginOrEmail: 'test0', password: '123456789' })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ accessToken: expect.any(String) });

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('Secure');
    });
  });

  describe('blogs', () => {
    it('should return 401 without basic auth', async () => {
      await server()
        .post(`/${GLOBAL_PREFIX}/blogs`)
        .send(blogBody)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for incorrect input', async () => {
      const { body } = await server()
        .post(`/${GLOBAL_PREFIX}/blogs`)
        .auth('admin', 'qwerty')
        .send({ name: '   ', description: 'd', websiteUrl: 'http://bad' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.errorsMessages).toEqual([
        { message: expect.any(String), field: 'name' },
        { message: expect.any(String), field: 'websiteUrl' },
      ]);
    });

    it('should create, update and get blog', async () => {
      const { body: blog } = await server()
        .post(`/${GLOBAL_PREFIX}/blogs`)
        .auth('admin', 'qwerty')
        .send(blogBody)
        .expect(HttpStatus.CREATED);

      expect(blog).toEqual({
        id: expect.any(String),
        ...blogBody,
        createdAt: expect.any(String),
        isMembership: false,
      });
      blogId = blog.id;

      await server()
        .put(`/${GLOBAL_PREFIX}/blogs/${blogId}`)
        .auth('admin', 'qwerty')
        .send({ ...blogBody, name: 'new name' })
        .expect(HttpStatus.NO_CONTENT);

      const { body } = await server()
        .get(`/${GLOBAL_PREFIX}/blogs/${blogId}`)
        .expect(HttpStatus.OK);

      expect(body.name).toBe('new name');
    });

    it('should return 404 for posts of not existing blog', async () => {
      await server()
        .get(`/${GLOBAL_PREFIX}/blogs/63189b06003380064c4193be/posts`)
        .expect(HttpStatus.NOT_FOUND);

      await server()
        .post(`/${GLOBAL_PREFIX}/blogs/63189b06003380064c4193be/posts`)
        .auth('admin', 'qwerty')
        .send(postBody)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('posts', () => {
    it('should return 400 if blog with blogId does not exist', async () => {
      const { body } = await server()
        .post(`/${GLOBAL_PREFIX}/posts`)
        .auth('admin', 'qwerty')
        .send({ ...postBody, blogId: '63189b06003380064c4193be' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(body).toEqual({
        errorsMessages: [{ message: expect.any(String), field: 'blogId' }],
      });
    });

    it('should create post for blog with empty likes info', async () => {
      const { body: post } = await server()
        .post(`/${GLOBAL_PREFIX}/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send(postBody)
        .expect(HttpStatus.CREATED);

      expect(post).toEqual({
        id: expect.any(String),
        ...postBody,
        blogId,
        blogName: 'new name',
        createdAt: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      });
      postId = post.id;
    });
  });

  describe('comments', () => {
    it('should return 401 without token and 400 for short content', async () => {
      await server()
        .post(`/${GLOBAL_PREFIX}/posts/${postId}/comments`)
        .send({ content: commentContent })
        .expect(HttpStatus.UNAUTHORIZED);

      await server()
        .post(`/${GLOBAL_PREFIX}/posts/${postId}/comments`)
        .auth(tokens[0].accessToken, { type: 'bearer' })
        .send({ content: 'short' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should create comment', async () => {
      const { body: comment } = await server()
        .post(`/${GLOBAL_PREFIX}/posts/${postId}/comments`)
        .auth(tokens[0].accessToken, { type: 'bearer' })
        .send({ content: commentContent })
        .expect(HttpStatus.CREATED);

      expect(comment).toEqual({
        id: expect.any(String),
        content: commentContent,
        commentatorInfo: { userId: expect.any(String), userLogin: 'test0' },
        createdAt: expect.any(String),
        likesInfo: { likesCount: 0, dislikesCount: 0, myStatus: 'None' },
      });
      commentId = comment.id;

      const { body } = await server()
        .get(`/${GLOBAL_PREFIX}/posts/${postId}/comments`)
        .expect(HttpStatus.OK);

      expect(body.totalCount).toBe(1);
    });

    it('should return 403 if user tries to edit or delete not own comment', async () => {
      await server()
        .put(`/${GLOBAL_PREFIX}/comments/${commentId}`)
        .auth(tokens[1].accessToken, { type: 'bearer' })
        .send({ content: commentContent + ' edited' })
        .expect(HttpStatus.FORBIDDEN);

      await server()
        .delete(`/${GLOBAL_PREFIX}/comments/${commentId}`)
        .auth(tokens[1].accessToken, { type: 'bearer' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('owner should update comment', async () => {
      await server()
        .put(`/${GLOBAL_PREFIX}/comments/${commentId}`)
        .auth(tokens[0].accessToken, { type: 'bearer' })
        .send({ content: commentContent + ' edited' })
        .expect(HttpStatus.NO_CONTENT);

      const { body } = await server()
        .get(`/${GLOBAL_PREFIX}/comments/${commentId}`)
        .expect(HttpStatus.OK);

      expect(body.content).toBe(commentContent + ' edited');
    });
  });

  describe('likes', () => {
    const likePost = (token: string, likeStatus: string, status = 204) =>
      server()
        .put(`/${GLOBAL_PREFIX}/posts/${postId}/like-status`)
        .auth(token, { type: 'bearer' })
        .send({ likeStatus })
        .expect(status);

    it('should return 400 for incorrect likeStatus and 404 for not existing post', async () => {
      const { body } = await likePost(tokens[0].accessToken, 'Super', 400);
      expect(body).toEqual({
        errorsMessages: [{ message: expect.any(String), field: 'likeStatus' }],
      });

      await server()
        .put(`/${GLOBAL_PREFIX}/posts/63189b06003380064c4193be/like-status`)
        .auth(tokens[0].accessToken, { type: 'bearer' })
        .send({ likeStatus: 'Like' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should count likes, dislikes, myStatus and newestLikes for post', async () => {
      await likePost(tokens[0].accessToken, 'Like');
      await delay(20);
      await likePost(tokens[1].accessToken, 'Like');
      await likePost(tokens[2].accessToken, 'Dislike');
      //повторный лайк ничего не меняет
      await likePost(tokens[1].accessToken, 'Like');

      const { body } = await server()
        .get(`/${GLOBAL_PREFIX}/posts/${postId}`)
        .auth(tokens[0].accessToken, { type: 'bearer' })
        .expect(HttpStatus.OK);

      expect(body.extendedLikesInfo).toEqual({
        likesCount: 2,
        dislikesCount: 1,
        myStatus: 'Like',
        newestLikes: [
          {
            addedAt: expect.any(String),
            userId: expect.any(String),
            login: 'test1',
          },
          {
            addedAt: expect.any(String),
            userId: expect.any(String),
            login: 'test0',
          },
        ],
      });

      //анонимный юзер
      const { body: list } = await server()
        .get(`/${GLOBAL_PREFIX}/posts`)
        .expect(HttpStatus.OK);

      expect(list.items[0].extendedLikesInfo.myStatus).toBe('None');
      expect(list.items[0].extendedLikesInfo.likesCount).toBe(2);
    });

    it('should change and reset like status', async () => {
      await likePost(tokens[0].accessToken, 'Dislike');
      await likePost(tokens[2].accessToken, 'None');

      const { body } = await server()
        .get(`/${GLOBAL_PREFIX}/blogs/${blogId}/posts`)
        .auth(tokens[0].accessToken, { type: 'bearer' })
        .expect(HttpStatus.OK);

      expect(body.items[0].extendedLikesInfo).toEqual({
        likesCount: 1,
        dislikesCount: 1,
        myStatus: 'Dislike',
        newestLikes: [
          {
            addedAt: expect.any(String),
            userId: expect.any(String),
            login: 'test1',
          },
        ],
      });
    });

    it('should like comment', async () => {
      await server()
        .put(`/${GLOBAL_PREFIX}/comments/${commentId}/like-status`)
        .auth(tokens[1].accessToken, { type: 'bearer' })
        .send({ likeStatus: 'Dislike' })
        .expect(HttpStatus.NO_CONTENT);

      const { body } = await server()
        .get(`/${GLOBAL_PREFIX}/posts/${postId}/comments`)
        .auth(tokens[1].accessToken, { type: 'bearer' })
        .expect(HttpStatus.OK);

      expect(body.items[0].likesInfo).toEqual({
        likesCount: 0,
        dislikesCount: 1,
        myStatus: 'Dislike',
      });
    });

    it('owner should delete comment', async () => {
      await server()
        .delete(`/${GLOBAL_PREFIX}/comments/${commentId}`)
        .auth(tokens[0].accessToken, { type: 'bearer' })
        .expect(HttpStatus.NO_CONTENT);

      await server()
        .get(`/${GLOBAL_PREFIX}/comments/${commentId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
