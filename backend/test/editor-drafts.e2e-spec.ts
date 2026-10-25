/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Role } from '../prisma/generated/client';

describe('Editor drafts GraphQL HTTP', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const marker = randomUUID();
  const userIds: string[] = [];
  let categoryId: string;
  let editorToken: string;
  let otherToken: string;
  let userToken: string;
  let adminToken: string;
  let draftId: string;
  let newsId: string;
  let tagIds: string[];
  let sourceId: string;
  const body = JSON.stringify({
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Hello ' },
          { type: 'text', text: 'world', marks: [{ type: 'bold' }] },
        ],
      },
    ],
  });
  const create = `mutation Create($data: CreateContentInput!) { createContent(data: $data) { id title body status category { id } } }`;
  const data = () => ({
    title: `Draft ${marker}`,
    description: 'A private article',
    type: 'ARTICLE',
    body,
    categoryId,
  });
  const post = (query: string, token?: string, variables?: object) => {
    const req = request(app.getHttpServer()).post('/graphql');
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req.send({ query, variables });
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    categoryId = (await prisma.category.create({ data: { name: `Editor ${marker}` } })).id;
    tagIds = await Promise.all(
      ['Science', 'Local'].map(async (name) => (await prisma.tag.create({ data: { name: `${name} ${marker}` } })).id),
    );
    sourceId = (await prisma.source.create({ data: { name: `Journal ${marker}`, url: 'https://example.org' } })).id;
    async function account(role: Role, label: string) {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query:
            'mutation Signup($email: String!, $username: String!) { signup(data: { email: $email, username: $username, password: "password123" }) { accessToken account { id } } }',
          variables: { email: `${label}-${marker}@example.test`, username: `${label}-${marker.slice(0, 8)}` },
        });
      const { id } = response.body.data.signup.account as { id: string };
      userIds.push(id);
      await prisma.user.update({ where: { id }, data: { role: [role] } });
      return response.body.data.signup.accessToken as string;
    }
    editorToken = await account(Role.EDITOR, 'editor');
    otherToken = await account(Role.EDITOR, 'other');
    userToken = await account(Role.USER, 'reader');
    adminToken = await account(Role.ADMIN, 'admin');
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.content.deleteMany({ where: { authorId: { in: userIds } } });
      await prisma.category.delete({ where: { id: categoryId } });
      await prisma.tag.deleteMany({ where: { id: { in: tagIds } } });
      await prisma.source.delete({ where: { id: sourceId } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (app) await app.close();
  });

  it('allows editors and administrators to create a formatted article draft in one category', async () => {
    const response = await post(create, editorToken, { data: data() });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createContent).toMatchObject({ body, status: 'DRAFT', category: { id: categoryId } });
    draftId = response.body.data.createContent.id as string;
    const admin = await post(create, adminToken, { data: { ...data(), title: 'Admin draft' } });
    expect(admin.body.errors).toBeUndefined();
  });

  it('rejects users, missing categories, and unsafe rich text', async () => {
    expect((await post(create, userToken, { data: data() })).body.errors).toBeDefined();
    expect((await post(create, editorToken, { data: { ...data(), categoryId: undefined } })).body.errors).toBeDefined();
    expect(
      (
        await post(create, editorToken, {
          data: { ...data(), body: JSON.stringify({ version: 1, type: 'doc', content: [{ type: 'script' }] }) },
        })
      ).body.errors,
    ).toBeDefined();
  });

  it('requires a category when another draft becomes an article', async () => {
    const video = await prisma.content.create({
      data: {
        title: 'Legacy video draft',
        description: 'Work in progress',
        type: 'VIDEO',
        authorId: userIds[0],
      },
    });
    const videoId = video.id;
    const changed = await post(
      'mutation Update($id: String!, $data: UpdateContentInput!) { updateContent(id: $id, data: $data) { id } }',
      editorToken,
      { id: videoId, data: { type: 'ARTICLE', body } },
    );
    expect(changed.body.errors).toBeDefined();
  });

  it('shows a draft only to its owner and never through public queries', async () => {
    const privateQuery = `query Drafts($id: String!) { myDrafts { id title } myDraft(id: $id) { id body category { id } } }`;
    const owner = await post(privateQuery, editorToken, { id: draftId });
    expect(owner.body.errors).toBeUndefined();
    expect(owner.body.data.myDrafts).toContainEqual({ id: draftId, title: `Draft ${marker}` });
    expect(owner.body.data.myDraft).toMatchObject({ id: draftId, body });
    const other = await post(privateQuery, otherToken, { id: draftId });
    expect(other.body.data.myDraft).toBeNull();
    expect(other.body.data.myDrafts).not.toContainEqual({ id: draftId, title: `Draft ${marker}` });
    const publicResult = await post(
      `query { content(id: "${draftId}") { id } publishedContents(search: "${marker}") { items { id } } publicProfile(id: "${userIds[0]}") { id username } }`,
    );
    expect(publicResult.body.errors).toBeUndefined();
    expect(publicResult.body.data.content).toBeNull();
    expect(publicResult.body.data.publishedContents.items).toEqual([]);
    expect(JSON.stringify(publicResult.body)).not.toContain(draftId);
    const update = await post(
      'mutation Update($id: String!, $data: UpdateContentInput!) { updateContent(id: $id, data: $data) { id } }',
      otherToken,
      { id: draftId, data: { title: 'Stolen' } },
    );
    expect(update.body.errors).toBeDefined();
  });

  it('creates and updates owned news with multiple tags and an optional source', async () => {
    const newsMutation = `mutation Create($data: CreateContentInput!) { createContent(data: $data) { id type body category { id } tags { id } source { id } } }`;
    const created = await post(newsMutation, editorToken, {
      data: { ...data(), type: 'NEWS', tagIds, sourceId },
    });
    expect(created.body.errors).toBeUndefined();
    expect(created.body.data.createContent).toMatchObject({
      type: 'NEWS',
      body,
      category: { id: categoryId },
      source: { id: sourceId },
    });
    const createdTags = created.body.data.createContent.tags as { id: string }[];
    expect(createdTags.map((tag) => tag.id).sort()).toEqual([...tagIds].sort());
    newsId = created.body.data.createContent.id as string;

    const own = await post('query($id: String!) { myDraft(id: $id) { id source { id } tags { id } } }', editorToken, {
      id: newsId,
    });
    expect(own.body.data.myDraft.source.id).toBe(sourceId);
    expect(own.body.data.myDraft.tags).toHaveLength(2);
    expect(
      (await post('query($id: String!) { myDraft(id: $id) { id } }', otherToken, { id: newsId })).body.data.myDraft,
    ).toBeNull();
    expect(
      (await post('query($id: String!) { content(id: $id) { id } }', undefined, { id: newsId })).body.data.content,
    ).toBeNull();

    const update =
      'mutation($id: String!, $data: UpdateContentInput!) { updateContent(id: $id, data: $data) { id tags { id } source { id } } }';
    expect(
      (await post(update, otherToken, { id: newsId, data: { tagIds: [], sourceId: null } })).body.errors,
    ).toBeDefined();
    const changed = await post(update, editorToken, { id: newsId, data: { tagIds: [tagIds[1]], sourceId: null } });
    expect(changed.body.errors).toBeUndefined();
    expect(changed.body.data.updateContent).toMatchObject({ tags: [{ id: tagIds[1] }], source: null });
    expect(
      (await post(create, editorToken, { data: { ...data(), type: 'NEWS', categoryId: undefined } })).body.errors,
    ).toBeDefined();
    expect(
      (await post(create, editorToken, { data: { ...data(), type: 'NEWS', body: '<script />' } })).body.errors,
    ).toBeDefined();
  });

  it.each(['VIDEO', 'PODCAST'])('creates a private %s draft with media metadata', async (type) => {
    const mutation = `mutation Create($data: CreateContentInput!) { createContent(data: $data) { id type status mediaUrl thumbnail duration body readTime category { id } tags { id } } }`;
    const mediaUrl =
      type === 'VIDEO'
        ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        : 'https://open.spotify.com/episode/4uLU6hMCjMI75M1A2tKUQC';
    const created = await post(mutation, editorToken, {
      data: {
        title: `${type} ${marker}`,
        description: 'Media draft',
        type,
        mediaUrl,
        thumbnail: 'https://example.org/cover.jpg',
        duration: 180,
        categoryId,
        tagIds: [tagIds[0]],
      },
    });
    expect(created.body.errors).toBeUndefined();
    const item = created.body.data.createContent;
    expect(item).toMatchObject({
      type,
      status: 'DRAFT',
      mediaUrl,
      thumbnail: 'https://example.org/cover.jpg',
      duration: 180,
      body: null,
      readTime: null,
      category: { id: categoryId },
      tags: [{ id: tagIds[0] }],
    });
    expect(
      (await post('query($id: String!) { myDraft(id: $id) { id } }', otherToken, { id: item.id })).body.data.myDraft,
    ).toBeNull();
    expect(
      (await post('query($id: String!) { content(id: $id) { id } }', undefined, { id: item.id })).body.data.content,
    ).toBeNull();
    expect(
      (
        await post(
          'mutation($id: String!, $data: UpdateContentInput!) { updateContent(id: $id, data: $data) { id } }',
          otherToken,
          { id: item.id, data: { title: 'Stolen' } },
        )
      ).body.errors,
    ).toBeDefined();
    expect(
      (
        await post(
          'mutation($id: String!, $data: UpdateContentInput!) { updateContent(id: $id, data: $data) { id } }',
          editorToken,
          { id: item.id, data: { mediaUrl: 'javascript:alert(1)' } },
        )
      ).body.errors,
    ).toBeDefined();
  });

  it('rejects invalid media fields and URLs', async () => {
    const base = {
      title: 'Media',
      description: 'Draft',
      type: 'VIDEO',
      mediaUrl: 'https://youtu.be/dQw4w9WgXcQ',
      categoryId,
    };
    for (const data of [
      { ...base, mediaUrl: 'javascript:alert(1)' },
      { ...base, thumbnail: 'file:///cover.jpg' },
      { ...base, categoryId: undefined },
      { ...base, mediaUrl: undefined },
      { ...base, body },
      { ...base, readTime: 4 },
      { ...base, duration: -1 },
    ]) {
      expect((await post(create, editorToken, { data })).body.errors).toBeDefined();
    }
  });

  it('still allows an editor to correct the title of legacy published media', async () => {
    const legacy = await prisma.content.create({
      data: {
        title: 'Older video',
        description: 'Imported before media draft rules',
        type: 'VIDEO',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorId: userIds[0],
      },
    });
    const changed = await post(
      'mutation($id: String!, $data: UpdateContentInput!) { updateContent(id: $id, data: $data) { id title } }',
      editorToken,
      { id: legacy.id, data: { title: 'Corrected video' } },
    );
    expect(changed.body.errors).toBeUndefined();
    expect(changed.body.data.updateContent.title).toBe('Corrected video');
  });
});
