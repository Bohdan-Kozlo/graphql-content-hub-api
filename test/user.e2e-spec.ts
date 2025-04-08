/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const sampleUser = {
    email: 'testuser@example.com',
    username: 'testuser',
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await app.close();
  });

  it('should create a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            createUser(data: {
              email: "${sampleUser.email}",
              username: "${sampleUser.username}",
              password: "${sampleUser.password}"
            }) {
              id
              email
              username
            }
          }
        `,
      });

    if (response.status !== 200) {
      console.error(JSON.stringify(response.body, null, 2));
    }

    expect(response.status).toBe(200);
    expect(response.body.data.createUser.email).toBe(sampleUser.email);
    expect(response.body.data.createUser.username).toBe(sampleUser.username);
  });

  it('should return a list of users', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            users {
              id
              email
              username
            }
          }
        `,
      });

    if (response.status !== 200) {
      console.error(JSON.stringify(response.body, null, 2));
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.users)).toBe(true);
    expect(response.body.data.users.length).toBeGreaterThan(0);
  });

  it('should return user by ID', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            createUser(data: {
              email: "findme@example.com",
              username: "findme",
              password: "pass123"
            }) {
              id
              email
            }
          }
        `,
      });

    const userId = createResponse.body.data.createUser.id;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            user(id: "${userId}") {
              id
              email
              username
            }
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe(userId);
  });

  it('should update user information', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            createUser(data: {
              email: "update@example.com",
              username: "updateme",
              password: "pass123"
            }) {
              id
            }
          }
        `,
      });

    const userId = createResponse.body.data.createUser.id;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            updateUser(data: {
              id: "${userId}",
              username: "updated"
            }) {
              id
              username
            }
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.updateUser.username).toBe('updated');
  });

  it('should delete a user', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            createUser(data: {
              email: "delete@example.com",
              username: "deleteme",
              password: "pass123"
            }) {
              id
            }
          }
        `,
      });

    const userId = createResponse.body.data.createUser.id;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            deleteUser(id: "${userId}")
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.deleteUser).toBe(true);
  });
});
