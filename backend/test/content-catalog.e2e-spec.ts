/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ContentStatus, ContentType } from '../prisma/generated/client';

type CatalogItem = { id: string; title: string; type: ContentType; publishedAt: string };
type CatalogPage = { items: CatalogItem[]; endCursor: string | null; hasMore: boolean };

describe('Public catalog GraphQL HTTP', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const marker = randomUUID();
  let authorId: string;
  const contentIds: string[] = [];

  const query = `query Catalog($first: Int!, $after: String, $search: String, $type: ContentType, $categoryId: String, $tagId: String, $authorId: String) {
    publishedContents(first: $first, after: $after, search: $search, type: $type, categoryId: $categoryId, tagId: $tagId, authorId: $authorId) {
      items { id title type publishedAt author { username } }
      endCursor
      hasMore
    }
  }`;

  async function page(first: number, after?: string): Promise<CatalogPage> {
    const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables: { first, after } });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    return response.body.data.publishedContents as CatalogPage;
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    authorId = (
      await prisma.user.create({
        data: { email: `${marker}@example.test`, username: 'Catalog Writer', password: 'unused-hash' },
      })
    ).id;

    for (const [type, day] of [
      [ContentType.ARTICLE, 4],
      [ContentType.VIDEO, 3],
      [ContentType.PODCAST, 3],
      [ContentType.NEWS, 2],
    ] as const) {
      const publishedAt = new Date(`2099-01-0${day}T12:00:00.000Z`);
      const content = await prisma.content.create({
        data: {
          id: `${marker}-${type.toLowerCase()}`,
          title: `${type} ${marker}`,
          description: 'Catalog summary',
          type,
          status: ContentStatus.PUBLISHED,
          publishedAt,
          authorId,
        },
      });
      contentIds.push(content.id);
    }

    const draft = await prisma.content.create({
      data: {
        title: `Secret draft ${marker}`,
        description: 'Private',
        type: ContentType.ARTICLE,
        status: ContentStatus.DRAFT,
        publishedAt: new Date('2099-01-05T12:00:00.000Z'),
        authorId,
      },
    });
    contentIds.push(draft.id);
  });

  afterAll(async () => {
    if (prisma && contentIds.length) await prisma.content.deleteMany({ where: { id: { in: contentIds } } });
    if (prisma && authorId) await prisma.user.delete({ where: { id: authorId } });
    if (app) await app.close();
  });

  it('returns only published types in date and ID order across pages without repeats', async () => {
    const expected = [`${marker}-article`, `${marker}-video`, `${marker}-podcast`, `${marker}-news`];

    const first = await page(2);
    expect(first.items.map((item) => item.id)).toEqual(expected.slice(0, 2));
    expect(first.hasMore).toBe(true);
    expect(first.endCursor).toBe(first.items[1].id);

    const second = await page(2, first.endCursor!);
    expect(second.items.map((item) => item.id)).toEqual(expected.slice(2));
    expect([...first.items, ...second.items].map((item) => item.type)).toEqual(['ARTICLE', 'VIDEO', 'PODCAST', 'NEWS']);
    expect(JSON.stringify({ first, second })).not.toContain('Secret draft');
    expect(JSON.stringify({ first, second })).not.toContain(`${marker}@example.test`);
  });

  it('rejects invalid page sizes and an unpublished cursor', async () => {
    for (const variables of [{ first: 0 }, { first: 31 }, { first: 2, after: contentIds[4] }]) {
      const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables });
      expect(response.body.errors).toBeDefined();
      expect(JSON.stringify(response.body)).not.toContain('Secret draft');
    }
  });

  it('searches title, description and body while combining public filters and pagination', async () => {
    const category = await prisma.category.create({ data: { name: `Topics ${marker}` } });
    const child = await prisma.category.create({ data: { name: `Nested ${marker}`, parentId: category.id } });
    const tag = await prisma.tag.create({ data: { name: `Focus ${marker}` } });
    try {
      await prisma.content.update({
        where: { id: `${marker}-article` },
        data: { title: `Orbit ${marker}`, categoryId: category.id, tags: { connect: { id: tag.id } } },
      });
      await prisma.content.update({
        where: { id: `${marker}-video` },
        data: { description: `Orbit ${marker}`, categoryId: category.id, tags: { connect: { id: tag.id } } },
      });
      await prisma.content.update({
        where: { id: `${marker}-podcast` },
        data: { body: `Orbit ${marker}`, categoryId: category.id, tags: { connect: { id: tag.id } } },
      });
      await prisma.content.update({
        where: { id: contentIds[4] },
        data: { title: `Orbit ${marker}`, categoryId: category.id, tags: { connect: { id: tag.id } } },
      });

      const first = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: { first: 2, search: `orbit ${marker}`, categoryId: category.id, tagId: tag.id },
        });
      expect(first.body.errors).toBeUndefined();
      const firstPage = first.body.data.publishedContents as CatalogPage;
      expect(firstPage.items.map((item) => item.id)).toEqual([`${marker}-article`, `${marker}-video`]);
      const second = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: {
            first: 2,
            after: firstPage.endCursor,
            search: `orbit ${marker}`,
            categoryId: category.id,
            tagId: tag.id,
          },
        });
      expect(second.body.errors).toBeUndefined();
      const secondPage = second.body.data.publishedContents as CatalogPage;
      expect(secondPage.items.map((item) => item.id)).toEqual([`${marker}-podcast`]);
      expect(JSON.stringify({ firstPage, secondPage })).not.toContain('Secret draft');

      const typed = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: { first: 12, search: `orbit ${marker}`, type: 'VIDEO', categoryId: category.id, tagId: tag.id },
        });
      expect(typed.body.errors).toBeUndefined();
      expect((typed.body.data.publishedContents as CatalogPage).items.map((item) => item.id)).toEqual([
        `${marker}-video`,
      ]);

      const authored = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: { first: 12, search: `orbit ${marker}`, authorId, type: 'VIDEO' },
        });
      expect(authored.body.errors).toBeUndefined();
      expect((authored.body.data.publishedContents as CatalogPage).items.map((item) => item.id)).toEqual([
        `${marker}-video`,
      ]);
      const otherAuthor = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: { first: 12, search: `orbit ${marker}`, authorId: randomUUID() },
        });
      expect(otherAuthor.body.errors).toBeUndefined();
      expect((otherAuthor.body.data.publishedContents as CatalogPage).items).toEqual([]);

      const categories = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ categories { id name parent { id } children { id } } tags { id name } }' });
      expect(categories.body.errors).toBeUndefined();
      expect(categories.body.data.categories).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: category.id })]),
      );
      expect(categories.body.data.categories).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: child.id, parent: { id: category.id } })]),
      );
      expect(categories.body.data.tags).toEqual(expect.arrayContaining([expect.objectContaining({ id: tag.id })]));
    } finally {
      await prisma.content.updateMany({ where: { id: { in: contentIds } }, data: { categoryId: null } });
      await prisma.tag.delete({ where: { id: tag.id } });
      await prisma.category.delete({ where: { id: child.id } });
      await prisma.category.delete({ where: { id: category.id } });
    }
  });
});
