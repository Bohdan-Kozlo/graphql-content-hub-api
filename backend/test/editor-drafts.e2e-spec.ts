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
  let adminDraftId: string;
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
    adminDraftId = admin.body.data.createContent.id as string;
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

  it('publishes only the author’s ready draft and exposes it newest first', async () => {
    const mutation = 'mutation($id: String!) { publishContent(id: $id) { id status publishedAt } }';
    const variables = { id: draftId };
    const older = await prisma.content.create({
      data: {
        title: `Older ${marker}`,
        description: 'Previously published',
        type: 'ARTICLE',
        body,
        authorId: userIds[0],
        categoryId,
        status: 'PUBLISHED',
        publishedAt: new Date('2020-01-01T00:00:00.000Z'),
      },
    });
    expect((await post(mutation, undefined, variables)).body.errors).toBeDefined();
    expect((await post(mutation, userToken, variables)).body.errors).toBeDefined();
    expect((await post(mutation, otherToken, variables)).body.errors).toBeDefined();
    expect((await post(mutation, adminToken, variables)).body.errors).toBeDefined();

    const before = Date.now();
    const published = await post(mutation, editorToken, variables);
    const after = Date.now();
    expect(published.body.errors).toBeUndefined();
    expect(published.body.data.publishContent).toMatchObject({ id: draftId, status: 'PUBLISHED' });
    const publishedAt = Date.parse(published.body.data.publishContent.publishedAt as string);
    expect(publishedAt).toBeGreaterThanOrEqual(before);
    expect(publishedAt).toBeLessThanOrEqual(after);

    const visible = await post(
      'query($id: String!, $search: String!) { content(id: $id) { id status publishedAt } publishedContents(search: $search) { items { id publishedAt } } }',
      undefined,
      { id: draftId, search: marker },
    );
    expect(visible.body.errors).toBeUndefined();
    expect(visible.body.data.content).toMatchObject({ id: draftId, status: 'PUBLISHED' });
    const catalogItems = visible.body.data.publishedContents.items as { id: string }[];
    expect(catalogItems.map((item) => item.id)).toEqual([draftId, older.id]);
    expect((await post(mutation, editorToken, variables)).body.errors).toBeDefined();
    expect(
      (await post('query($id: String!) { myDraft(id: $id) { id } }', editorToken, variables)).body.data.myDraft,
    ).toBeNull();
    const adminPublished = await post(mutation, adminToken, { id: adminDraftId });
    expect(adminPublished.body.errors).toBeUndefined();
    expect(adminPublished.body.data.publishContent).toMatchObject({ id: adminDraftId, status: 'PUBLISHED' });
  });

  it('keeps incomplete legacy drafts private', async () => {
    const incomplete = await prisma.content.create({
      data: {
        title: `Incomplete ${marker}`,
        description: 'Missing category',
        type: 'ARTICLE',
        body,
        authorId: userIds[0],
      },
    });
    const mutation = 'mutation($id: String!) { publishContent(id: $id) { id } }';
    expect((await post(mutation, editorToken, { id: incomplete.id })).body.errors).toBeDefined();
    expect(
      (await post('query($id: String!) { content(id: $id) { id } }', undefined, { id: incomplete.id })).body.data
        .content,
    ).toBeNull();
  });

  it('does not publish an article with empty text', async () => {
    const empty = await post(create, editorToken, {
      data: {
        ...data(),
        body: JSON.stringify({ version: 1, type: 'doc', content: [{ type: 'paragraph' }] }),
      },
    });
    expect(empty.body.errors).toBeUndefined();
    const id = empty.body.data.createContent.id as string;
    const mutation = 'mutation($id: String!) { publishContent(id: $id) { id } }';
    expect((await post(mutation, editorToken, { id })).body.errors).toBeDefined();
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

  it('edits only owned published content without changing its first publication date', async () => {
    const firstPublishedAt = new Date('2020-01-01T00:00:00.000Z');
    const story = await prisma.content.create({
      data: {
        ...data(),
        title: `Original ${marker}`,
        authorId: userIds[0],
        status: 'PUBLISHED',
        publishedAt: firstPublishedAt,
        tagIds: undefined,
      },
    });
    const update =
      'mutation($id: String!, $data: UpdateContentInput!) { updateContent(id: $id, data: $data) { id title description body status publishedAt category { id } tags { id } source { id } } }';
    const changedBody = JSON.stringify({
      version: 1,
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Corrected text' }] }],
    });
    const changes = {
      title: `Corrected ${marker}`,
      description: 'Updated description',
      body: changedBody,
      categoryId,
      tagIds,
      sourceId,
    };
    expect((await post(update, otherToken, { id: story.id, data: changes })).body.errors).toBeDefined();
    expect((await post(update, adminToken, { id: story.id, data: changes })).body.errors).toBeDefined();
    expect((await post(update, userToken, { id: story.id, data: changes })).body.errors).toBeDefined();
    const owner = await post(update, editorToken, { id: story.id, data: changes });
    expect(owner.body.errors).toBeUndefined();
    expect(owner.body.data.updateContent).toMatchObject({
      title: changes.title,
      description: changes.description,
      body: changedBody,
      status: 'PUBLISHED',
      publishedAt: firstPublishedAt.toISOString(),
      category: { id: categoryId },
      source: { id: sourceId },
    });
    expect((owner.body.data.updateContent.tags as { id: string }[]).map(({ id }) => id).sort()).toEqual(
      [...tagIds].sort(),
    );
    const publicStory = await post('query($id: String!) { content(id: $id) { title body publishedAt } }', undefined, {
      id: story.id,
    });
    expect(publicStory.body.data.content).toEqual({
      title: changes.title,
      body: changedBody,
      publishedAt: firstPublishedAt.toISOString(),
    });
    const ownList = await post('query { myPublishedContents { id } }', editorToken);
    expect(ownList.body.data.myPublishedContents).toContainEqual({ id: story.id });
    expect(
      (await post('query { myPublishedContents { id } }', otherToken)).body.data.myPublishedContents,
    ).not.toContainEqual({ id: story.id });
    expect((await post('query { myPublishedContents { id } }', userToken)).body.errors).toBeDefined();
    expect(
      (await post('query($id: String!) { myContent(id: $id) { id } }', otherToken, { id: story.id })).body.data
        .myContent,
    ).toBeNull();
  });

  it('updates published media fields and rejects unsafe URLs', async () => {
    const story = await prisma.content.create({
      data: {
        title: 'Video',
        description: 'Initial',
        type: 'VIDEO',
        mediaUrl: 'https://example.org/old',
        categoryId,
        authorId: userIds[0],
        status: 'PUBLISHED',
        publishedAt: new Date('2020-01-01T00:00:00.000Z'),
      },
    });
    const update =
      'mutation($id: String!, $data: UpdateContentInput!) { updateContent(id: $id, data: $data) { mediaUrl thumbnail duration publishedAt } }';
    expect(
      (await post(update, editorToken, { id: story.id, data: { mediaUrl: 'javascript:alert(1)' } })).body.errors,
    ).toBeDefined();
    const changed = await post(update, editorToken, {
      id: story.id,
      data: { mediaUrl: 'https://example.org/new', thumbnail: 'https://example.org/cover.jpg', duration: 90 },
    });
    expect(changed.body.errors).toBeUndefined();
    expect(changed.body.data.updateContent).toEqual({
      mediaUrl: 'https://example.org/new',
      thumbnail: 'https://example.org/cover.jpg',
      duration: 90,
      publishedAt: '2020-01-01T00:00:00.000Z',
    });
  });

  it('deletes owned content and its discussion, reactions, views, and bookmarks', async () => {
    const story = await prisma.content.create({
      data: { ...data(), authorId: userIds[0], status: 'PUBLISHED', publishedAt: new Date() },
    });
    const comment = await prisma.comment.create({ data: { contentId: story.id, userId: userIds[2], text: 'Comment' } });
    await prisma.comment.create({
      data: { contentId: story.id, userId: userIds[0], parentId: comment.id, text: 'Reply' },
    });
    await prisma.reaction.create({ data: { contentId: story.id, userId: userIds[2], type: 'LIKE' } });
    await prisma.reaction.create({ data: { contentId: story.id, userId: userIds[2], type: 'SAVE' } });
    await prisma.view.create({ data: { contentId: story.id, userId: userIds[2], requestId: randomUUID() } });
    await prisma.readingHistory.create({ data: { contentId: story.id, userId: userIds[2] } });
    const remove = 'mutation($id: String!) { removeContent(id: $id) }';
    expect((await post(remove, otherToken, { id: story.id })).body.errors).toBeDefined();
    expect((await post(remove, adminToken, { id: story.id })).body.errors).toBeDefined();
    expect((await post(remove, userToken, { id: story.id })).body.errors).toBeDefined();
    expect((await post(remove, editorToken, { id: story.id })).body.data.removeContent).toBe(true);
    expect(
      (await post('query($id: String!) { content(id: $id) { id } }', undefined, { id: story.id })).body.data.content,
    ).toBeNull();
    expect(await prisma.comment.count({ where: { contentId: story.id } })).toBe(0);
    expect(await prisma.reaction.count({ where: { contentId: story.id } })).toBe(0);
    expect(await prisma.view.count({ where: { contentId: story.id } })).toBe(0);
    expect(await prisma.readingHistory.count({ where: { contentId: story.id } })).toBe(0);
  });
});
