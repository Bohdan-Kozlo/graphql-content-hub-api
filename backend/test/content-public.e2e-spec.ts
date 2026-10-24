/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ContentStatus, ContentType, ReactionType } from '../prisma/generated/client';

describe('Public Content GraphQL HTTP', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const marker = randomUUID();
  const publishedAt = new Date('2026-01-15T12:00:00.000Z');
  let authorId: string;
  let categoryId: string;
  let tagId: string;
  let sourceId: string;
  let publishedId: string;
  let draftId: string;
  let draftCommentId: string;
  let readerEmail: string;
  let otherReaderEmail: string;

  const query = `query PublicContent($id: String!) {
    content(id: $id) {
      id title description body type status publishedAt likeCount liked saved
      author { id username bio avatarUrl }
      category { id name }
      tags { id name }
      source { id name url }
    }
  }`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    const author = await prisma.user.create({
      data: { email: `${marker}@example.test`, username: 'Public Writer', password: 'unused-hash' },
    });
    authorId = author.id;
    categoryId = (await prisma.category.create({ data: { name: `Science ${marker}` } })).id;
    tagId = (await prisma.tag.create({ data: { name: `Astronomy ${marker}` } })).id;
    sourceId = (await prisma.source.create({ data: { name: `Journal ${marker}`, url: 'https://example.org' } })).id;

    publishedId = (
      await prisma.content.create({
        data: {
          title: 'A public story',
          description: 'A visible summary',
          body: 'A visible body',
          type: ContentType.ARTICLE,
          status: ContentStatus.PUBLISHED,
          publishedAt,
          author: { connect: { id: authorId } },
          category: { connect: { id: categoryId } },
          source: { connect: { id: sourceId } },
          tags: { connect: [{ id: tagId }] },
        },
      })
    ).id;
    await prisma.comment.create({ data: { contentId: publishedId, userId: authorId, text: 'Public comment' } });
    await prisma.reaction.create({ data: { contentId: publishedId, userId: authorId, type: ReactionType.LIKE } });
    await prisma.reaction.create({ data: { contentId: publishedId, userId: authorId, type: ReactionType.SAVE } });
    draftId = (
      await prisma.content.create({
        data: {
          title: 'Secret draft',
          description: 'Private summary',
          type: ContentType.ARTICLE,
          status: ContentStatus.DRAFT,
          author: { connect: { id: authorId } },
        },
      })
    ).id;
    draftCommentId = (
      await prisma.comment.create({ data: { contentId: draftId, userId: authorId, text: 'Private comment' } })
    ).id;
    await prisma.reaction.create({ data: { contentId: draftId, userId: authorId, type: ReactionType.LIKE } });
    await prisma.view.create({ data: { contentId: draftId, userId: authorId, requestId: randomUUID() } });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.readingHistory.deleteMany({ where: { contentId: { in: [publishedId, draftId].filter(Boolean) } } });
      await prisma.view.deleteMany({ where: { contentId: { in: [publishedId, draftId].filter(Boolean) } } });
      await prisma.reaction.deleteMany({ where: { contentId: { in: [publishedId, draftId].filter(Boolean) } } });
      await prisma.comment.deleteMany({ where: { contentId: { in: [publishedId, draftId].filter(Boolean) } } });
      await prisma.content.deleteMany({ where: { id: { in: [publishedId, draftId].filter(Boolean) } } });
      if (tagId) await prisma.tag.delete({ where: { id: tagId } });
      if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
      if (sourceId) await prisma.source.delete({ where: { id: sourceId } });
      if (readerEmail) await prisma.user.delete({ where: { email: readerEmail } });
      if (otherReaderEmail) await prisma.user.delete({ where: { email: otherReaderEmail } });
      if (authorId) await prisma.user.delete({ where: { id: authorId } });
    }
    if (app) await app.close();
  });

  it('returns a published story and its public relations without a session', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables: { id: publishedId } });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.content).toMatchObject({
      id: publishedId,
      title: 'A public story',
      body: 'A visible body',
      status: 'PUBLISHED',
      publishedAt: publishedAt.toISOString(),
      author: { id: authorId, username: 'Public Writer' },
      category: { id: categoryId },
      tags: [{ id: tagId }],
      source: { id: sourceId },
      likeCount: 1,
      liked: false,
      saved: false,
    });
    expect(JSON.stringify(response.body.data)).not.toContain(`${marker}@example.test`);

    const interactions = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `query {
          commentsByContent(contentId: "${publishedId}") { text user { id username } content { id title author { username } } }
        }`,
      });
    expect(interactions.body.errors).toBeUndefined();
    expect(interactions.body.data.commentsByContent[0].text).toBe('Public comment');
    expect(JSON.stringify(interactions.body.data)).not.toContain(`${marker}@example.test`);
  });

  it('does not expose a draft or the author email through the public query', async () => {
    const draft = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables: { id: draftId } });
    expect(draft.status).toBe(200);
    expect(draft.body.errors).toBeUndefined();
    expect(draft.body.data.content).toBeNull();

    const privateField = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `query { content(id: "${publishedId}") { author { email } } }` });
    expect(privateField.body.errors).toBeDefined();
    expect(JSON.stringify(privateField.body)).not.toContain(`${marker}@example.test`);

    const reverseRelation = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `query { category(id: "${categoryId}") { contents { id } } }` });
    expect(reverseRelation.body.errors).toBeDefined();
    expect(JSON.stringify(reverseRelation.body)).not.toContain('Secret draft');
  });

  it('does not reveal draft data through public interaction queries', async () => {
    const comments = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `query { commentsByContent(contentId: "${draftId}") { id text } }` });
    expect(comments.body.data.commentsByContent).toEqual([]);

    const comment = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `query { comment(id: "${draftCommentId}") { content { title body } } }` });
    expect(comment.body.errors).toBeDefined();
    expect(JSON.stringify(comment.body)).not.toContain('Secret draft');

    const counts = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `query { viewCount(contentId: "${draftId}") }` });
    expect(counts.body.data.viewCount).toBe(0);

    const views = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `query { viewsByContent(contentId: "${draftId}") { id content { title } } }` });
    expect(views.body.errors).toBeDefined();
    expect(JSON.stringify(views.body)).not.toContain('Secret draft');

    const popular = await request(app.getHttpServer()).post('/graphql').send({ query: 'query { mostViewedContent }' });
    expect(popular.body.errors).toBeDefined();
    expect(JSON.stringify(popular.body)).not.toContain('Secret draft');

    const privateUser = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `query { commentsByContent(contentId: "${publishedId}") { user { email } } }` });
    expect(privateUser.body.errors).toBeDefined();
    expect(JSON.stringify(privateUser.body)).not.toContain(`${marker}@example.test`);
  });

  it('counts each view request once and returns only the reader’s paginated history', async () => {
    readerEmail = `reader-${marker}@example.test`;
    otherReaderEmail = `other-reader-${marker}@example.test`;
    const signup = async (email: string, username: string) => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation { signup(data: { email: "${email}", username: "${username}", password: "password123" }) { accessToken } }`,
        });
      expect(response.body.errors).toBeUndefined();
      return response.body.data.signup.accessToken as string;
    };
    const readerToken = await signup(readerEmail, 'history-reader');
    const otherReaderToken = await signup(otherReaderEmail, 'other-history-reader');

    const countBefore = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `query { viewCount(contentId: "${publishedId}") }` });

    const guestRequestId = randomUUID();
    const createGuestView = () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation { createView(data: { contentId: "${publishedId}", requestId: "${guestRequestId}" }) { id } }`,
        });
    expect((await createGuestView()).body.errors).toBeUndefined();
    expect((await createGuestView()).body.errors).toBeUndefined();

    const readerRequestId = randomUUID();
    const createReaderView = () =>
      request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          query: `mutation { createView(data: { contentId: "${publishedId}", requestId: "${readerRequestId}" }) { id } }`,
        });
    expect((await createReaderView()).body.errors).toBeUndefined();
    expect((await createReaderView()).body.errors).toBeUndefined();

    const reusedByAnotherReader = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${otherReaderToken}`)
      .send({
        query: `mutation { createView(data: { contentId: "${publishedId}", requestId: "${readerRequestId}" }) { user { id } } }`,
      });
    expect(reusedByAnotherReader.body.errors).toBeDefined();
    expect(JSON.stringify(reusedByAnotherReader.body)).not.toContain('history-reader');

    const countAfter = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `query { viewCount(contentId: "${publishedId}") }` });
    expect(countAfter.body.data.viewCount).toBe(countBefore.body.data.viewCount + 2);

    const history = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({
        query: 'query { myViewHistory(first: 20) { items { id title } endCursor hasMore } }',
      });
    expect(history.body.errors).toBeUndefined();
    expect(history.body.data.myViewHistory).toMatchObject({
      items: [{ id: publishedId, title: 'A public story' }],
      hasMore: false,
    });

    const otherHistory = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${otherReaderToken}`)
      .send({ query: 'query { myViewHistory(first: 20) { items { id } } }' });
    expect(otherHistory.body.errors).toBeUndefined();
    expect(otherHistory.body.data.myViewHistory.items).toEqual([]);

    const anonymousHistory = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'query { myViewHistory(first: 20) { items { id } } }' });
    expect(anonymousHistory.body.errors).toBeDefined();
  });
});
