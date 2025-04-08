/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreateUserInput } from './../src/modules/user/dto/create-user.input';

// Define a sample user input for testing
const sampleUser: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  username: 'testuser',
  bio: 'This is a test user',
  avatarUrl: 'http://example.com/avatar.png',
};

describe('User Module (e2e)', () => {
  let app: INestApplication;

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

  it('should create a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation {
          createUser(input: {
            email: "${sampleUser.email}",
            password: "${sampleUser.password}",
            username: "${sampleUser.username}",
            bio: "${sampleUser.bio}",
            avatarUrl: "${sampleUser.avatarUrl}"
          }) {
            id
            email
            username
          }
        }`,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.createUser.email).toBe(sampleUser.email);
    expect(response.body.data.createUser.username).toBe(sampleUser.username);
  });

  it('should return a list of users', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `query {
          getUsers {
            id
            email
            username
          }
        }`,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.getUsers).toBeInstanceOf(Array);
    expect(response.body.data.getUsers.length).toBeGreaterThan(0);
  });

  it('should return user by ID', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation {
          createUser(input: {
            email: "finduser@example.com",
            password: "password123",
            username: "finduser",
            bio: "This user will be found",
            avatarUrl: "http://example.com/avatar.png"
          }) {
            id
            email
            username
          }
        }`,
      });

    const userId = createResponse.body.data.createUser.id;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `query {
          getUserById(id: "${userId}") {
            id
            email
            username
          }
        }`,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.getUserById.id).toBe(userId);
    expect(response.body.data.getUserById.username).toBe('finduser');
  });

  it('should update user information', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation {
          createUser(input: {
            email: "updateuser@example.com",
            password: "password123",
            username: "updateuser",
            bio: "This user will be updated",
            avatarUrl: "http://example.com/avatar.png"
          }) {
            id
            email
            username
          }
        }`,
      });

    const userId = createResponse.body.data.createUser.id;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation {
          updateUser(id: "${userId}", input: {
            username: "updateduser",
            bio: "Updated bio"
          }) {
            id
            username
            bio
          }
        }`,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.updateUser.username).toBe('updateduser');
    expect(response.body.data.updateUser.bio).toBe('Updated bio');
  });

  it('should delete a user', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation {
          createUser(input: {
            email: "deleteuser@example.com",
            password: "password123",
            username: "deleteuser",
            bio: "This user will be deleted",
            avatarUrl: "http://example.com/avatar.png"
          }) {
            id
            email
            username
          }
        }`,
      });

    const userId = createResponse.body.data.createUser.id;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation {
          deleteUser(id: "${userId}") {
            id
            email
            username
          }
        }`,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.deleteUser.id).toBe(userId);
  });
});
