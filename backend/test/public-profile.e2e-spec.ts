/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ContentStatus, ContentType } from '../prisma/generated/client';

describe('Public profiles (GraphQL HTTP)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const marker = randomUUID();
  const email = `profile-${marker}@example.test`;
  let ownerId: string;
  let otherId: string;
  let accessToken: string;

  const publicQuery = `query PublicProfile($id: String!) {
    publicProfile(id: $id) { id username bio avatarUrl }
    publishedContents(first: 12, authorId: $id) { items { id title status } }
  }`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    const signup = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { signup(data: { email: "${email}", username: "Reader", password: "password123" }) { accessToken account { id } } }`,
      });
    const signupData = signup.body as { data?: { signup?: { accessToken: string; account: { id: string } } } };
    if (!signupData.data?.signup) throw new Error('Profile test signup failed');
    accessToken = signupData.data.signup.accessToken;
    ownerId = signupData.data.signup.account.id;
    otherId = (
      await prisma.user.create({
        data: { email: `other-${marker}@example.test`, username: 'Other', password: 'unused-hash' },
      })
    ).id;
    await prisma.content.createMany({
      data: [
        {
          title: 'Visible story',
          description: 'Public',
          type: ContentType.ARTICLE,
          status: ContentStatus.PUBLISHED,
          authorId: ownerId,
        },
        {
          title: 'Secret draft',
          description: 'Private',
          type: ContentType.ARTICLE,
          status: ContentStatus.DRAFT,
          authorId: ownerId,
        },
      ],
    });
  });

  afterAll(async () => {
    if (prisma && ownerId) await prisma.content.deleteMany({ where: { authorId: ownerId } });
    if (prisma && ownerId) await prisma.user.delete({ where: { id: ownerId } });
    if (prisma && otherId) await prisma.user.delete({ where: { id: otherId } });
    if (app) await app.close();
  });

  it('shows safe public fields and only published authored content without a session', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: publicQuery, variables: { id: ownerId } });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.publicProfile).toEqual({ id: ownerId, username: 'Reader', bio: null, avatarUrl: null });
    const items = response.body.data.publishedContents.items as Array<{ title: string }>;
    expect(items.map((item) => item.title)).toEqual(['Visible story']);
    expect(JSON.stringify(response.body)).not.toContain(email);
    expect(JSON.stringify(response.body)).not.toContain('Secret draft');

    for (const field of ['email', 'roles', 'contents', 'comments', 'bookmarks', 'readingHistory', 'subscriptions']) {
      const privateField = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `query($id: String!) { publicProfile(id: $id) { ${field} } }`,
          variables: { id: ownerId },
        });
      expect(privateField.body.errors).toBeDefined();
      expect(JSON.stringify(privateField.body)).not.toContain(email);
    }
    const missing = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: publicQuery, variables: { id: randomUUID() } });
    expect(missing.body.data.publicProfile).toBeNull();
    const reader = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: publicQuery, variables: { id: otherId } });
    expect(reader.body.data.publicProfile.username).toBe('Other');
    expect(reader.body.data.publishedContents.items).toEqual([]);
  });

  it('lets only the authenticated owner update allowed fields and clear optional fields', async () => {
    const query = `mutation Update($data: UpdateOwnProfileInput!) { updateProfile(data: $data) { id username bio avatarUrl } }`;
    const variables = {
      data: {
        username: '  Updated Reader  ',
        bio: '  New biography  ',
        avatarUrl: '  https://example.test/avatar.png  ',
      },
    };
    const anonymous = await request(app.getHttpServer()).post('/graphql').send({ query, variables });
    expect(anonymous.body.errors).toBeDefined();
    const changed = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ query, variables });
    expect(changed.body.errors).toBeUndefined();
    expect(changed.body.data.updateProfile).toEqual({
      id: ownerId,
      username: 'Updated Reader',
      bio: 'New biography',
      avatarUrl: 'https://example.test/avatar.png',
    });
    const cleared = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query,
        variables: { data: { bio: '', avatarUrl: '' } },
      });
    expect(cleared.body.data.updateProfile).toEqual({
      id: ownerId,
      username: 'Updated Reader',
      bio: null,
      avatarUrl: null,
    });
    expect((await prisma.user.findUnique({ where: { id: otherId } }))?.username).toBe('Other');

    for (const data of [
      { email: 'stolen@example.test' },
      { password: 'new-password' },
      { role: ['ADMIN'] },
      { id: otherId },
    ]) {
      const forbidden = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query, variables: { data } });
      expect(forbidden.body.errors).toBeDefined();
    }
    expect((await prisma.user.findUnique({ where: { id: ownerId } }))?.email).toBe(email);
  });

  it('rejects invalid profile values on the API', async () => {
    const query = `mutation Update($data: UpdateOwnProfileInput!) { updateProfile(data: $data) { id } }`;
    for (const data of [
      { username: ' ' },
      { username: null },
      { username: 'x'.repeat(51) },
      { bio: 'x'.repeat(501) },
      { avatarUrl: 'javascript:alert(1)' },
      { avatarUrl: 'https://example.test/' + 'x'.repeat(2048) },
    ]) {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query, variables: { data } });
      expect(response.body.errors).toBeDefined();
    }
  });
});
