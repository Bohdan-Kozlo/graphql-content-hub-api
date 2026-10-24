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

  async unfollowAuthor(userId: string, authorId: string) {
    const deleted = await this.prisma.subscription.deleteMany({
      where: { userId, type: SubscriptionType.AUTHOR, targetId: authorId },
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

  async followingFeed(userId: string, first: number, after?: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, type: SubscriptionType.AUTHOR },
      select: { targetId: true },
    });
    return this.content.findPublishedByAuthors(
      subscriptions.map(({ targetId }) => targetId),
      first,
      after,
      userId,
    );
  }
}
