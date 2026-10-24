import { BadRequestException, Injectable } from '@nestjs/common';
import { SubscriptionType } from '../../../prisma/generated/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ContentService } from '../content/content.service';
import { publicAuthorSelect } from '../content/public-content.include';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly content: ContentService,
  ) {}

  async followAuthor(userId: string, authorId: string) {
    const author = await this.prisma.user.findUnique({ where: { id: authorId }, select: publicAuthorSelect });
    if (!author) throw new BadRequestException('Author not found');
    await this.prisma.subscription.upsert({
      where: { userId_type_targetId: { userId, type: SubscriptionType.AUTHOR, targetId: authorId } },
      create: { userId, type: SubscriptionType.AUTHOR, targetId: authorId },
      update: {},
    });
    return author;
  }

  async followCategory(userId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new BadRequestException('Category not found');
    await this.prisma.subscription.upsert({
      where: { userId_type_targetId: { userId, type: SubscriptionType.CATEGORY, targetId: categoryId } },
      create: { userId, type: SubscriptionType.CATEGORY, targetId: categoryId },
      update: {},
    });
    return category;
  }

  async followSource(userId: string, sourceId: string) {
    const source = await this.prisma.source.findUnique({ where: { id: sourceId } });
    if (!source) throw new BadRequestException('Source not found');
    await this.prisma.subscription.upsert({
      where: { userId_type_targetId: { userId, type: SubscriptionType.SOURCE, targetId: sourceId } },
      create: { userId, type: SubscriptionType.SOURCE, targetId: sourceId },
      update: {},
    });
    return source;
  }

  async unfollowAuthor(userId: string, authorId: string) {
    const deleted = await this.prisma.subscription.deleteMany({
      where: { userId, type: SubscriptionType.AUTHOR, targetId: authorId },
    });
    return deleted.count > 0;
  }

  async unfollowCategory(userId: string, categoryId: string) {
    const deleted = await this.prisma.subscription.deleteMany({
      where: { userId, type: SubscriptionType.CATEGORY, targetId: categoryId },
    });
    return deleted.count > 0;
  }

  async unfollowSource(userId: string, sourceId: string) {
    const deleted = await this.prisma.subscription.deleteMany({
      where: { userId, type: SubscriptionType.SOURCE, targetId: sourceId },
    });
    return deleted.count > 0;
  }

  async myFollowedAuthors(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, type: SubscriptionType.AUTHOR },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { targetId: true },
    });
    const authors = await this.prisma.user.findMany({
      where: { id: { in: subscriptions.map(({ targetId }) => targetId) } },
      select: publicAuthorSelect,
    });
    const byId = new Map(authors.map((author) => [author.id, author]));
    return subscriptions.map(({ targetId }) => byId.get(targetId)).filter((author) => author !== undefined);
  }

  async myFollowedCategories(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, type: SubscriptionType.CATEGORY },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { targetId: true },
    });
    const categories = await this.prisma.category.findMany({
      where: { id: { in: subscriptions.map(({ targetId }) => targetId) } },
    });
    const byId = new Map(categories.map((category) => [category.id, category]));
    return subscriptions.map(({ targetId }) => byId.get(targetId)).filter((category) => category !== undefined);
  }

  async myFollowedSources(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, type: SubscriptionType.SOURCE },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { targetId: true },
    });
    const sources = await this.prisma.source.findMany({
      where: { id: { in: subscriptions.map(({ targetId }) => targetId) } },
    });
    const byId = new Map(sources.map((source) => [source.id, source]));
    return subscriptions.map(({ targetId }) => byId.get(targetId)).filter((source) => source !== undefined);
  }

  async followingFeed(userId: string, first: number, after?: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      select: { type: true, targetId: true },
    });
    return this.content.findPublishedForFollowing(
      {
        authorIds: subscriptions.filter(({ type }) => type === SubscriptionType.AUTHOR).map(({ targetId }) => targetId),
        categoryIds: subscriptions
          .filter(({ type }) => type === SubscriptionType.CATEGORY)
          .map(({ targetId }) => targetId),
        sourceIds: subscriptions.filter(({ type }) => type === SubscriptionType.SOURCE).map(({ targetId }) => targetId),
      },
      first,
      after,
      userId,
    );
  }
}
