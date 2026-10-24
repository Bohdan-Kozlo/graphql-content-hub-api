import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContentInput } from './dto/create-content.input';
import { UserService } from '../user/user.service';
import { UpdateContentInput } from './dto/update-content.input';
import { ContentStatus, ContentType, Prisma, ReactionType } from '../../../prisma/generated/client';
import { publicContentInclude } from './public-content.include';

type CatalogFilters = {
  search?: string;
  type?: ContentType;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
};

type PublicContent = Prisma.ContentGetPayload<{ include: typeof publicContentInclude }>;
type ContentWithReactionState = PublicContent & { likeCount: number; liked: boolean; saved: boolean };

@Injectable()
export class ContentService {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService,
  ) {}

  async create(data: CreateContentInput, userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const content = await this.prismaService.content.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        body: data.body,
        mediaUrl: data.mediaUrl,
        duration: data.duration,
        thumbnail: data.thumbnail,
        readTime: data.readTime,
        author: { connect: { id: userId } },
        category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
        source: data.sourceId ? { connect: { id: data.sourceId } } : undefined,
        tags: data.tagIds ? { connect: data.tagIds.map((id) => ({ id })) } : undefined,
      },
      include: publicContentInclude,
    });
    return (await this.withReactionState([content], userId))[0];
  }

  async findPublishedById(id: string, userId: string | null = null): Promise<ContentWithReactionState | null> {
    const content = await this.prismaService.content.findFirst({
      where: {
        id,
        status: ContentStatus.PUBLISHED,
      },
      include: publicContentInclude,
    });
    if (!content) return null;
    return (await this.withReactionState([content], userId))[0];
  }

  async findPublishedPage(first: number, after?: string, filters: CatalogFilters = {}, userId: string | null = null) {
    const where = this.publishedContentWhere(filters);

    if (after) {
      const cursor = await this.prismaService.content.findFirst({
        where: { ...where, id: after },
        select: { id: true },
      });
      if (!cursor) throw new BadRequestException('Invalid catalog cursor');
    }

    const contents = await this.prismaService.content.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: first + 1,
      cursor: after ? { id: after } : undefined,
      skip: after ? 1 : undefined,
      include: publicContentInclude,
    });
    const items = await this.withReactionState(contents.slice(0, first), userId);

    return {
      items,
      endCursor: items.at(-1)?.id ?? null,
      hasMore: contents.length > first,
    };
  }

  async withReactionState(contents: PublicContent[], userId: string | null): Promise<ContentWithReactionState[]> {
    if (contents.length === 0) return [];

    const contentIds = contents.map(({ id }) => id);
    const [likeCounts, viewerReactionTypes] = await Promise.all([
      this.likeCountsByContentId(contentIds),
      this.viewerReactionTypesByContentId(contentIds, userId),
    ]);

    return contents.map((content) =>
      this.contentWithReactionState(content, likeCounts, viewerReactionTypes.get(content.id)),
    );
  }

  private publishedContentWhere(filters: CatalogFilters): Prisma.ContentWhereInput {
    const where: Prisma.ContentWhereInput = { status: ContentStatus.PUBLISHED };
    const searchTerm = filters.search?.trim();

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { body: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (filters.type) where.type = filters.type;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.tagId) where.tags = { some: { id: filters.tagId } };
    if (filters.authorId) where.authorId = filters.authorId;

    return where;
  }

  private async likeCountsByContentId(contentIds: string[]) {
    const counts = await this.prismaService.reaction.groupBy({
      by: ['contentId'],
      where: { contentId: { in: contentIds }, type: ReactionType.LIKE },
      _count: { _all: true },
    });
    return new Map(counts.map((count) => [count.contentId, count._count._all]));
  }

  private async viewerReactionTypesByContentId(contentIds: string[], userId: string | null) {
    if (!userId) return new Map<string, Set<ReactionType>>();

    const reactions = await this.prismaService.reaction.findMany({
      where: { userId, contentId: { in: contentIds } },
      select: { contentId: true, type: true },
    });
    const typesByContentId = new Map<string, Set<ReactionType>>();
    for (const reaction of reactions) {
      const types = typesByContentId.get(reaction.contentId) ?? new Set<ReactionType>();
      types.add(reaction.type);
      typesByContentId.set(reaction.contentId, types);
    }
    return typesByContentId;
  }

  private contentWithReactionState(
    content: PublicContent,
    likeCounts: Map<string, number>,
    viewerReactionTypes: Set<ReactionType> | undefined,
  ): ContentWithReactionState {
    return {
      ...content,
      likeCount: likeCounts.get(content.id) ?? 0,
      liked: viewerReactionTypes?.has(ReactionType.LIKE) ?? false,
      saved: viewerReactionTypes?.has(ReactionType.SAVE) ?? false,
    };
  }

  async update(id: string, data: UpdateContentInput, userId: string) {
    const contentBelongsToUser = await this.prismaService.content.findFirst({
      where: {
        id,
        authorId: userId,
      },
    });

    if (!contentBelongsToUser) {
      throw new BadRequestException('Content does not belong to user');
    }

    const content = await this.prismaService.content.update({
      where: {
        id,
      },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        body: data.body,
        mediaUrl: data.mediaUrl,
        duration: data.duration,
        thumbnail: data.thumbnail,
        readTime: data.readTime,
        category:
          data.categoryId === undefined
            ? undefined
            : data.categoryId
              ? { connect: { id: data.categoryId } }
              : { disconnect: true },
        source:
          data.sourceId === undefined
            ? undefined
            : data.sourceId
              ? { connect: { id: data.sourceId } }
              : { disconnect: true },
        tags: data.tagIds ? { set: data.tagIds.map((id) => ({ id })) } : undefined,
      },
      include: publicContentInclude,
    });
    return (await this.withReactionState([content], userId))[0];
  }

  async remove(id: string, userId: string) {
    const contentBelongsToUser = await this.prismaService.content.findFirst({
      where: {
        id,
        authorId: userId,
      },
    });

    if (!contentBelongsToUser) {
      throw new BadRequestException('Content does not belong to user');
    }

    const deletedContent = await this.prismaService.content.delete({
      where: {
        id,
      },
    });

    return deletedContent ? true : false;
  }
}
