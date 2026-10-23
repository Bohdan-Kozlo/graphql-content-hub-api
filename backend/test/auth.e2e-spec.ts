/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Account authentication (GraphQL HTTP)', () => {
  let app: INestApplication;
  const email = `auth-${Date.now()}@example.com`;
  const cookie = (response: request.Response) => response.headers['set-cookie']?.[0]?.split(';')[0];

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.get(PrismaService).user.deleteMany({ where: { email } });
    await app.close();
  });

  it('registers only USER and keeps refresh token out of GraphQL', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { signup(data: { email: "${email}", username: "reader", password: "password123" }) { accessToken } }`,
      });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.signup.accessToken).toBeTruthy();
    expect(cookie(response)).toContain('content_hub_refresh=');
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax');
    expect(response.body.data.signup.refreshToken).toBeUndefined();
    const user = await app.get(PrismaService).user.findUnique({ where: { email } });
    expect(user?.role).toEqual(['USER']);
  });

  it('rejects attempts to choose a role at signup', async () => {
    const response = await request(app.getHttpServer()).post('/graphql').send({
      query:
        'mutation { signup(data: { email: "other@example.com", username: "other", password: "password123", role: ADMIN }) { accessToken } }',
    });
    expect(response.body.errors).toBeDefined();
  });

  it('rejects a cross-origin session mutation', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Origin', 'https://different.example')
      .send({ query: `mutation { login(data: { email: "${email}", password: "password123" }) { accessToken } }` });
    expect(response.body.errors).toBeDefined();
    expect(response.headers['set-cookie']).toBeUndefined();
    const withoutOrigin = await request(app.getHttpServer())
      .post('/graphql')
      .set('Sec-Fetch-Site', 'cross-site')
      .send({ query: `mutation { login(data: { email: "${email}", password: "password123" }) { accessToken } }` });
    expect(withoutOrigin.body.errors).toBeDefined();
  });

  it('requires authorization for me and rotates the cookie on refresh', async () => {
    const anonymous = await request(app.getHttpServer()).post('/graphql').send({ query: '{ me { email } }' });
    expect(anonymous.body.errors).toBeDefined();
    const signedIn = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `mutation { login(data: { email: "${email}", password: "password123" }) { accessToken } }` });
    expect(signedIn.body.errors).toBeUndefined();
    const firstCookie = cookie(signedIn);
    const profile = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${signedIn.body.data.login.accessToken}`)
      .send({ query: '{ me { email username roles } }' });
    expect(profile.body.data.me).toEqual({ email, username: 'reader', roles: ['USER'] });
    const adminOnly = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${signedIn.body.data.login.accessToken}`)
      .send({ query: '{ users { id } }' });
    expect(adminOnly.body.errors).toBeDefined();

    const renewed = await request(app.getHttpServer())
      .post('/graphql')
      .set('Cookie', firstCookie)
      .send({ query: 'mutation { refreshTokens { accessToken } }' });
    expect(renewed.body.errors).toBeUndefined();
    expect(renewed.body.data.refreshTokens.accessToken).toBeTruthy();
    const secondCookie = cookie(renewed);
    expect(secondCookie).toContain('content_hub_refresh=');
    const replay = await request(app.getHttpServer())
      .post('/graphql')
      .set('Cookie', firstCookie)
      .send({ query: 'mutation { refreshTokens { accessToken } }' });
    expect(replay.body.errors).toBeDefined();

    const signedOut = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${renewed.body.data.refreshTokens.accessToken}`)
      .set('Cookie', secondCookie)
      .send({ query: 'mutation { logout }' });
    expect(signedOut.body.data.logout).toBe(true);
    const afterLogout = await request(app.getHttpServer())
      .post('/graphql')
      .set('Cookie', secondCookie)
      .send({ query: 'mutation { refreshTokens { accessToken } }' });
    expect(afterLogout.body.errors).toBeDefined();
  });
});
