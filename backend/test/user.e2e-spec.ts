/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Role } from '../prisma/generated/client';

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  const adminEmail = 'e2e-admin@example.com';

  const authorizedRequest = () =>
    request(app.getHttpServer()).post('/graphql').set('Authorization', `Bearer ${accessToken}`);

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
    const signup = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { signup(data: { email: "${adminEmail}", username: "e2e-admin", password: "testPassword" }) { accessToken } }`,
      });
    expect(signup.body.errors).toBeUndefined();
    await prisma.user.update({ where: { email: adminEmail }, data: { role: { set: [Role.ADMIN] } } });
    const login = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { login(data: { email: "${adminEmail}", password: "testPassword" }) { accessToken } }`,
      });
    expect(login.body.errors).toBeUndefined();
    accessToken = login.body.data.login.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: [adminEmail, sampleUser.email, 'findme@example.com', 'update@example.com', 'delete@example.com'] },
      },
    });
    await app.close();
  });

  it('should create a new user', async () => {
    const response = await authorizedRequest().send({
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
    const response = await authorizedRequest().send({
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
    const createResponse = await authorizedRequest().send({
      query: `
          mutation {
            createUser(data: {
              email: "findme@example.com",
              username: "findme",
              password: "password123"
            }) {
              id
              email
            }
          }
        `,
    });

    const userId = createResponse.body.data.createUser.id;

    const response = await authorizedRequest().send({
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
    const createResponse = await authorizedRequest().send({
      query: `
          mutation {
            createUser(data: {
              email: "update@example.com",
              username: "updateme",
              password: "password123"
            }) {
              id
            }
          }
        `,
    });

    const userId = createResponse.body.data.createUser.id;

    const response = await authorizedRequest().send({
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

  it('validates a mutation with both id and data arguments', async () => {
    const category = await prisma.category.create({ data: { name: `Before ${Date.now()}` } });
    try {
      const response = await authorizedRequest().send({
        query: `mutation { updateCategory(id: "${category.id}", data: { name: "Updated category" }) { id name } }`,
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.updateCategory.name).toBe('Updated category');
    } finally {
      await prisma.category.delete({ where: { id: category.id } });
    }
  });

  it('should delete a user', async () => {
    const createResponse = await authorizedRequest().send({
      query: `
          mutation {
            createUser(data: {
              email: "delete@example.com",
              username: "deleteme",
              password: "password123"
            }) {
              id
            }
          }
        `,
    });

    const userId = createResponse.body.data.createUser.id;

    const response = await authorizedRequest().send({
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
