/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ContentStatus, ContentType } from '../prisma/generated/client';

describe('Author following (GraphQL HTTP)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const marker = randomUUID();
  let readerId: string;
  let authorId: string;
  let otherId: string;
  let token: string;
  let otherToken: string;

  const subscriptions = 'query { myFollowedAuthors { id username } }';
  const feed =
    'query($first: Int!, $after: String) { followingFeed(first: $first, after: $after) { items { id title status author { id } } endCursor hasMore } }';
  const follow = 'mutation($id: String!) { followAuthor(id: $id) { id username } }';
  const unfollow = 'mutation($id: String!) { unfollowAuthor(id: $id) }';

  async function graphql(query: string, variables?: object, accessToken?: string) {
    const call = request(app.getHttpServer()).post('/graphql');
    if (accessToken) call.set('Authorization', `Bearer ${accessToken}`);
    return call.send({ query, variables });
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    for (const name of ['Reader', 'Author', 'Other']) {
      const email = `${name.toLowerCase()}-${marker}@example.test`;
      const response = await graphql(
        `mutation { signup(data: { email: "${email}", username: "${name}", password: "password123" }) { accessToken account { id } } }`,
      );
      const data = response.body.data?.signup;
      if (!data) throw new Error(`${name} signup failed`);
      if (name === 'Reader') {
        readerId = data.account.id;
        token = data.accessToken;
      }
      if (name === 'Author') authorId = data.account.id;
      if (name === 'Other') {
        otherId = data.account.id;
        otherToken = data.accessToken;
      }
    }
    await prisma.content.createMany({
      data: [
        {
          id: `${marker}-new`,
          title: 'New followed',
          description: 'New',
          type: ContentType.ARTICLE,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date('2099-01-03'),
          authorId,
        },
        {
          id: `${marker}-old`,
          title: 'Old followed',
          description: 'Old',
          type: ContentType.ARTICLE,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date('2099-01-01'),
          authorId,
        },
        {
          id: `${marker}-draft`,
          title: 'Hidden draft',
          description: 'Private',
          type: ContentType.ARTICLE,
          status: ContentStatus.DRAFT,
          publishedAt: new Date('2099-01-04'),
          authorId,
        },
        {
          id: `${marker}-other`,
          title: 'Unfollowed',
          description: 'Other',
          type: ContentType.ARTICLE,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date('2099-01-05'),
          authorId: otherId,
        },
      ],
    });
  });

  afterAll(async () => {
    if (prisma && readerId) await prisma.subscription.deleteMany({ where: { userId: readerId } });
    if (prisma && authorId) await prisma.content.deleteMany({ where: { id: { startsWith: marker } } });
    for (const id of [readerId, authorId, otherId]) if (prisma && id) await prisma.user.delete({ where: { id } });
    if (app) await app.close();
  });

  it('keeps subscriptions and feed private, validates targets, and avoids duplicates', async () => {
    for (const query of [subscriptions, feed]) expect((await graphql(query, { first: 2 })).body.errors).toBeDefined();
    expect((await graphql(follow, { id: randomUUID() }, token)).body.errors).toBeDefined();
    expect((await graphql(follow, { id: authorId }, token)).body.data.followAuthor.id).toBe(authorId);
    expect((await graphql(follow, { id: authorId }, token)).body.data.followAuthor.id).toBe(authorId);
    expect((await graphql(subscriptions, undefined, token)).body.data.myFollowedAuthors).toEqual([
      { id: authorId, username: 'Author' },
    ]);
    expect((await graphql(subscriptions, undefined, otherToken)).body.data.myFollowedAuthors).toEqual([]);
    expect(await prisma.subscription.count({ where: { userId: readerId, targetId: authorId } })).toBe(1);
  });

  it('returns only followed published content newest first with pagination, then removes it after unfollow', async () => {
    const first = (await graphql(feed, { first: 1 }, token)).body.data.followingFeed;
    expect(first.items.map((item: { title: string }) => item.title)).toEqual(['New followed']);
    expect(first.hasMore).toBe(true);
    const second = (await graphql(feed, { first: 1, after: first.endCursor }, token)).body.data.followingFeed;
    expect(second.items.map((item: { title: string }) => item.title)).toEqual(['Old followed']);
    expect(second.hasMore).toBe(false);
    expect((await graphql(feed, { first: 2, after: `${marker}-draft` }, token)).body.errors).toBeDefined();
    expect((await graphql(unfollow, { id: authorId }, token)).body.data.unfollowAuthor).toBe(true);
    expect((await graphql(feed, { first: 2 }, token)).body.data.followingFeed.items).toEqual([]);
    expect((await graphql(subscriptions, undefined, token)).body.data.myFollowedAuthors).toEqual([]);
  });
});
