/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ContentStatus, ContentType, Role } from '../prisma/generated/client';

describe('Comments (GraphQL HTTP)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const marker = randomUUID();
  let ownerId: string;
  let readerId: string;
  let otherId: string;
  let adminId: string;
  let publishedId: string;
  let draftId: string;
  let readerToken: string;
  let otherToken: string;
  let adminToken: string;

  const gql = (query: string, token?: string) => {
    const call = request(app.getHttpServer()).post('/graphql').send({ query });
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };
  const create = (contentId: string, text: string, token: string, parentId?: string) =>
    gql(
      `mutation { createComment(data: { contentId: "${contentId}", text: "${text}"${parentId ? `, parentId: "${parentId}"` : ''} }) { id text isDeleted } }`,
      token,
    );

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    ownerId = (
      await prisma.user.create({
        data: { email: `author-${marker}@example.test`, username: 'Author', password: 'unused' },
      })
    ).id;
    for (const [name, role] of [
      ['reader', Role.USER],
      ['other', Role.USER],
      ['admin', Role.ADMIN],
    ] as const) {
      const response = await gql(
        `mutation { signup(data: { email: "${name}-${marker}@example.test", username: "${name}", password: "password123" }) { accessToken } }`,
      );
      const user = await prisma.user.findUniqueOrThrow({ where: { email: `${name}-${marker}@example.test` } });
      if (role === Role.ADMIN) await prisma.user.update({ where: { id: user.id }, data: { role: [Role.ADMIN] } });
      if (name === 'reader') {
        readerId = user.id;
        readerToken = response.body.data.signup.accessToken;
      }
      if (name === 'other') {
        otherId = user.id;
        otherToken = response.body.data.signup.accessToken;
      }
      if (name === 'admin') {
        adminId = user.id;
        adminToken = response.body.data.signup.accessToken;
      }
    }
    publishedId = (
      await prisma.content.create({
        data: {
          title: 'Discussion',
          description: 'Published',
          type: ContentType.ARTICLE,
          status: ContentStatus.PUBLISHED,
          authorId: ownerId,
        },
      })
    ).id;
    draftId = (
      await prisma.content.create({
        data: {
          title: 'Draft',
          description: 'Private',
          type: ContentType.ARTICLE,
          status: ContentStatus.DRAFT,
          authorId: ownerId,
        },
      })
    ).id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.comment.deleteMany({ where: { contentId: { in: [publishedId, draftId].filter(Boolean) } } });
      await prisma.content.deleteMany({ where: { id: { in: [publishedId, draftId].filter(Boolean) } } });
      await prisma.user.deleteMany({ where: { id: { in: [ownerId, readerId, otherId, adminId].filter(Boolean) } } });
    }
    if (app) await app.close();
  });

  it('allows one reply level on published content and exposes only public author fields', async () => {
    expect((await create(draftId, 'No draft comment', readerToken)).body.errors).toBeDefined();
    expect((await create(publishedId, 'No guest comment', '')).body.errors).toBeDefined();
    const parent = await create(publishedId, 'Top level', readerToken);
    expect(parent.body.errors).toBeUndefined();
    const parentId = parent.body.data.createComment.id;
    const reply = await create(publishedId, 'One reply', otherToken, parentId);
    expect(reply.body.errors).toBeUndefined();
    expect(
      (await create(publishedId, 'Too deep', readerToken, reply.body.data.createComment.id)).body.errors,
    ).toBeDefined();
    expect((await create(publishedId, 'Wrong story', readerToken, draftId)).body.errors).toBeDefined();
    const list = await gql(
      `query { commentsByContent(contentId: "${publishedId}") { id text user { id username avatarUrl } replies { id text user { id username } } } }`,
    );
    expect(list.body.errors).toBeUndefined();
    expect(list.body.data.commentsByContent).toContainEqual(
      expect.objectContaining({ id: parentId, replies: [expect.objectContaining({ text: 'One reply' })] }),
    );
    expect(JSON.stringify(list.body)).not.toContain(`reader-${marker}@example.test`);
    expect(
      (await gql(`query { commentsByContent(contentId: "${publishedId}") { user { email } } }`)).body.errors,
    ).toBeDefined();
  });

  it('restricts editing and retains replies when owner or admin removes a parent', async () => {
    const parentId = (await create(publishedId, 'Owner text', readerToken)).body.data.createComment.id;
    const replyId = (await create(publishedId, 'Still here', otherToken, parentId)).body.data.createComment.id;
    expect(
      (await gql(`mutation { updateComment(id: "${parentId}", data: { text: "Hijacked" }) { id } }`, otherToken)).body
        .errors,
    ).toBeDefined();
    expect((await gql(`mutation { deleteComment(id: "${parentId}") }`, otherToken)).body.errors).toBeDefined();
    expect(
      (await gql(`mutation { updateComment(id: "${parentId}", data: { text: "Edited" }) { text } }`, readerToken)).body
        .data.updateComment.text,
    ).toBe('Edited');
    expect((await gql(`mutation { deleteComment(id: "${parentId}") }`, readerToken)).body.data.deleteComment).toBe(
      true,
    );
    const list = await gql(
      `query { commentsByContent(contentId: "${publishedId}") { id text isDeleted replies { id text } } }`,
    );
    expect(list.body.data.commentsByContent).toContainEqual(
      expect.objectContaining({
        id: parentId,
        text: '[deleted]',
        isDeleted: true,
        replies: [{ id: replyId, text: 'Still here' }],
      }),
    );
    expect(
      (await gql(`mutation { updateComment(id: "${parentId}", data: { text: "Resurrected" }) { id } }`, readerToken))
        .body.errors,
    ).toBeDefined();
    expect((await create(publishedId, 'Reply to removed', readerToken, parentId)).body.errors).toBeDefined();
    const moderatedId = (await create(publishedId, 'Moderate me', otherToken)).body.data.createComment.id;
    expect((await gql(`mutation { deleteComment(id: "${moderatedId}") }`, adminToken)).body.data.deleteComment).toBe(
      true,
    );
  });
});
