/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ContentStatus, ContentType } from '../prisma/generated/client';

describe('Content reactions (GraphQL HTTP)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const marker = randomUUID();
  let ownerId: string;
  let readerId: string;
  let readerToken: string;
  let publishedId: string;
  let draftId: string;

  const requestGraphql = (query: string, token?: string) => {
    const http = request(app.getHttpServer()).post('/graphql').send({ query });
    return token ? http.set('Authorization', `Bearer ${token}`) : http;
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    const owner = await prisma.user.create({
      data: { email: `owner-${marker}@example.test`, username: 'Owner', password: 'unused-hash' },
    });
    ownerId = owner.id;
    publishedId = (
      await prisma.content.create({
        data: {
          title: 'Published reaction story',
          description: 'A story for reactions',
          type: ContentType.ARTICLE,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
          authorId: ownerId,
        },
      })
    ).id;
    draftId = (
      await prisma.content.create({
        data: {
          title: 'Draft reaction story',
          description: 'A private story',
          type: ContentType.ARTICLE,
          status: ContentStatus.DRAFT,
          authorId: ownerId,
        },
      })
    ).id;
    const signup = await requestGraphql(
      `mutation { signup(data: { email: "reader-${marker}@example.test", username: "Reader", password: "password123" }) { accessToken } }`,
    );
    readerToken = signup.body.data.signup.accessToken;
    readerId = (await prisma.user.findUniqueOrThrow({ where: { email: `reader-${marker}@example.test` } })).id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.reaction.deleteMany({ where: { contentId: { in: [publishedId, draftId].filter(Boolean) } } });
      await prisma.content.deleteMany({ where: { id: { in: [publishedId, draftId].filter(Boolean) } } });
      await prisma.user.deleteMany({ where: { id: { in: [ownerId, readerId].filter(Boolean) } } });
    }
    if (app) await app.close();
  });

  it('toggles only LIKE and SAVE, exposes viewer state, and keeps Saved private', async () => {
    const anonymousSaved = await requestGraphql('{ savedContents(first: 12) { items { id } } }');
    expect(anonymousSaved.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');

    const like = await requestGraphql(
      `mutation { toggleContentReaction(data: { contentId: "${publishedId}", type: LIKE }) { contentId liked saved likeCount } }`,
      readerToken,
    );
    expect(like.body.errors).toBeUndefined();
    expect(like.body.data.toggleContentReaction).toEqual({
      contentId: publishedId,
      liked: true,
      saved: false,
      likeCount: 1,
    });

    const save = await requestGraphql(
      `mutation { toggleContentReaction(data: { contentId: "${publishedId}", type: SAVE }) { contentId liked saved likeCount } }`,
      readerToken,
    );
    expect(save.body.data.toggleContentReaction).toEqual({
      contentId: publishedId,
      liked: true,
      saved: true,
      likeCount: 1,
    });

    const readerPublicContent = await requestGraphql(
      `query { content(id: "${publishedId}") { id likeCount liked saved } publishedContents(first: 12) { items { id liked saved } } }`,
      readerToken,
    );
    expect(readerPublicContent.body.errors).toBeUndefined();
    expect(readerPublicContent.body.data.content).toEqual({
      id: publishedId,
      likeCount: 1,
      liked: true,
      saved: true,
    });
    expect(readerPublicContent.body.data.publishedContents.items).toContainEqual({
      id: publishedId,
      liked: true,
      saved: true,
    });

    const saved = await requestGraphql(
      '{ savedContents(first: 12) { items { id likeCount liked saved } endCursor hasMore } }',
      readerToken,
    );
    expect(saved.body.errors).toBeUndefined();
    expect(saved.body.data.savedContents.items).toEqual([{ id: publishedId, likeCount: 1, liked: true, saved: true }]);

    const publicContent = await requestGraphql(`query { content(id: "${publishedId}") { id likeCount liked saved } }`);
    expect(publicContent.body.errors).toBeUndefined();
    expect(publicContent.body.data.content).toEqual({
      id: publishedId,
      likeCount: 1,
      liked: false,
      saved: false,
    });

    const unlike = await requestGraphql(
      `mutation { toggleContentReaction(data: { contentId: "${publishedId}", type: LIKE }) { liked saved likeCount } }`,
      readerToken,
    );
    expect(unlike.body.data.toggleContentReaction).toEqual({ liked: false, saved: true, likeCount: 0 });

    const unsave = await requestGraphql(
      `mutation { toggleContentReaction(data: { contentId: "${publishedId}", type: SAVE }) { liked saved likeCount } }`,
      readerToken,
    );
    expect(unsave.body.data.toggleContentReaction).toEqual({ liked: false, saved: false, likeCount: 0 });
    const emptySaved = await requestGraphql('{ savedContents(first: 12) { items { id } } }', readerToken);
    expect(emptySaved.body.data.savedContents.items).toEqual([]);

    const draft = await requestGraphql(
      `mutation { toggleContentReaction(data: { contentId: "${draftId}", type: LIKE }) { liked } }`,
      readerToken,
    );
    expect(draft.body.errors).toBeDefined();
  });
});
