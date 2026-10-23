/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('GraphQL argument validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it.each([
    '{ publicProfile(id: "") { id } }',
    '{ viewCount(contentId: "") }',
    '{ popularTags(limit: 0) { id } }',
    '{ publishedContents(first: 0) { items { id } } }',
    'mutation { requestPasswordReset(email: "not-an-email") }',
    'mutation { createView(data: { contentId: "" }) { id } }',
    'mutation { signup(data: { email: "valid@example.test", username: "  ", password: "password123" }) { accessToken } }',
  ])('rejects invalid input before the resolver service: %s', async (query) => {
    const response = await request(app.getHttpServer()).post('/graphql').send({ query });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
  });
});
