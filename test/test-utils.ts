/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export const createTestUser = async (
  app: INestApplication,
  userData = {
    username: 'testPassword',
    password: 'testPassword',
  },
) => {
  await request(app.getHttpServer())
    .post('/graphql')
    .send({
      query: `
        mutation {
          signup(data: {
            username: "${userData.username}"
            password: "${userData.password}"
          }) {
            accessToken
          }
        }
      `,
    });
};

export const loginAndGetAccessToken = async (
  app: INestApplication,
  userData = {
    username: 'testuser',
    password: 'password123',
  },
): Promise<string> => {
  const response = await request(app.getHttpServer())
    .post('/graphql')
    .send({
      query: `
        mutation {
          login(data: {
            username: "${userData.username}",
            password: "${userData.password}"
          }) {
            accessToken
          }
        }
      `,
    });

  return response.body.data.login.accessToken;
};

export const authorizedRequest = (
  app: INestApplication,
  token: string,
) => {
  return request(app.getHttpServer()).post('/graphql').set('Authorization', `Bearer ${token}`);
};
