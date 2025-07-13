/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth Module (e2e)', () => {
  let app: INestApplication;
  let refreshToken: string;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/signup (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation {
          signup(data: {email: "testEmail", username: "testEmail", password: "testPassword"}) {
            accessToken
            refreshToken
          }
        }`,
      });
    expect(response.status).toBe(200);
    expect(response.body.data.signup.accessToken).toBeDefined();
    expect(response.body.data.signup.refreshToken).toBeDefined();
  });

  it('/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation {
          login(data: { email: "testEmail", password: "testPassword" }) {
            accessToken
            refreshToken
          }
        }`,
      });
    expect(response.status).toBe(200);
    expect(response.body.data.login.accessToken).toBeDefined();
    refreshToken = response.body.data.login.refreshToken;
    expect(response.body.data.login.refreshToken).toBeDefined();
  });

  it('/auth/refreshTokens (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${refreshToken}`)
      .send({
        query: `mutation {
          refreshTokens {
            accessToken
            refreshToken
          }
        }`,
      });
    expect(response.status).toBe(200);
    expect(response.body.data.refreshTokens.accessToken).toBeDefined();
    accessToken = response.body.data.refreshTokens.accessToken;
    expect(response.body.data.refreshTokens.refreshToken).toBeDefined();
  });

  it('/auth/logout (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: `mutation {
          logout
        }`,
      });
    expect(response.status).toBe(200);
    expect(response.body.data.logout).toBe(true);
  });
});
