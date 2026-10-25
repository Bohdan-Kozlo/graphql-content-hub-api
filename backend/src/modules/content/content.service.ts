import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContentInput } from './dto/create-content.input';
import { UserService } from '../user/user.service';
import { UpdateContentInput } from './dto/update-content.input';
import { ContentStatus, ContentType, Prisma, ReactionType } from '../../../prisma/generated/client';
import { publicContentInclude } from './public-content.include';
import { validateArticleBody } from './article-body';
import { validateMediaDraft } from './media-draft';

type CatalogFilters = {
  search?: string;
  type?: ContentType;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
};

type PublicContent = Prisma.ContentGetPayload<{ include: typeof publicContentInclude }>;
type ContentWithEngagementState = PublicContent & {
  likeCount: number;
  viewCount: number;
  liked: boolean;
  saved: boolean;
};

@Injectable()
export class ContentService {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService,
  ) {}

  async create(data: CreateContentInput, userId: string) {
    validateMediaDraft(data);
    if (data.type === ContentType.ARTICLE || data.type === ContentType.NEWS) {
      if (!data.categoryId) throw new BadRequestException('Content category is required');
      validateArticleBody(data.body);
    }
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
    return (await this.withEngagementState([content], userId))[0];
  }

  async findPublishedById(id: string, userId: string | null = null): Promise<ContentWithEngagementState | null> {
    const content = await this.prismaService.content.findFirst({
      where: {
        id,
        status: ContentStatus.PUBLISHED,
      },
      include: publicContentInclude,
    });
    if (!content) return null;
    return (await this.withEngagementState([content], userId))[0];
  }

  async findOwnDrafts(userId: string) {
    const contents = await this.prismaService.content.findMany({
      where: { authorId: userId, status: ContentStatus.DRAFT },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      include: publicContentInclude,
    });
    return this.withEngagementState(contents, userId);
  }

  async findOwnDraft(id: string, userId: string) {
    const content = await this.prismaService.content.findFirst({
      where: { id, authorId: userId, status: ContentStatus.DRAFT },
      include: publicContentInclude,
    });
    return content ? (await this.withEngagementState([content], userId))[0] : null;
  }

  async findPublishedPage(first: number, after?: string, filters: CatalogFilters = {}, userId: string | null = null) {
    const where = this.publishedContentWhere(filters);

    return this.findPublishedWhere(where, first, after, userId);
  }

  async findPublishedForFollowing(
    targets: { authorIds: string[]; categoryIds: string[]; sourceIds: string[] },
    first: number,
    after: string | undefined,
    userId: string,
  ) {
    return this.findPublishedWhere(
      {
        status: ContentStatus.PUBLISHED,
        OR: [
          { authorId: { in: targets.authorIds } },
          { categoryId: { in: targets.categoryIds } },
          { sourceId: { in: targets.sourceIds } },
        ],
      },
      first,
      after,
      userId,
    );
  }

  private async findPublishedWhere(
    where: Prisma.ContentWhereInput,
    first: number,
    after: string | undefined,
    userId: string | null,
  ) {
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
    const items = await this.withEngagementState(contents.slice(0, first), userId);

    return {
      items,
      endCursor: items.at(-1)?.id ?? null,
      hasMore: contents.length > first,
    };
  }

  async withEngagementState(contents: PublicContent[], userId: string | null): Promise<ContentWithEngagementState[]> {
    if (contents.length === 0) return [];

    const contentIds = contents.map(({ id }) => id);
    const [likeCounts, viewCounts, viewerReactionTypes] = await Promise.all([
      this.likeCountsByContentId(contentIds),
      this.viewCountsByContentId(contentIds),
      this.viewerReactionTypesByContentId(contentIds, userId),
    ]);

    return contents.map((content) =>
      this.contentWithEngagementState(content, likeCounts, viewCounts, viewerReactionTypes.get(content.id)),
    );
  }

  async getPublishedViewCount(contentId: string): Promise<number> {
    return this.prismaService.view.count({
      where: { contentId, content: { is: { status: ContentStatus.PUBLISHED } } },
    });
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

  private async viewCountsByContentId(contentIds: string[]) {
    const counts = await this.prismaService.view.groupBy({
      by: ['contentId'],
      where: { contentId: { in: contentIds }, content: { is: { status: ContentStatus.PUBLISHED } } },
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

  private contentWithEngagementState(
    content: PublicContent,
    likeCounts: Map<string, number>,
    viewCounts: Map<string, number>,
    viewerReactionTypes: Set<ReactionType> | undefined,
  ): ContentWithEngagementState {
    return {
      ...content,
      likeCount: likeCounts.get(content.id) ?? 0,
      viewCount: viewCounts.get(content.id) ?? 0,
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
    if (
      data.type === ContentType.ARTICLE ||
      data.type === ContentType.NEWS ||
      ((contentBelongsToUser.type === ContentType.ARTICLE || contentBelongsToUser.type === ContentType.NEWS) &&
        data.body !== undefined)
    )
      validateArticleBody(data.body ?? contentBelongsToUser.body ?? undefined);
    const updatedType = data.type ?? contentBelongsToUser.type;
    if (
      contentBelongsToUser.status === ContentStatus.DRAFT &&
      (updatedType === ContentType.VIDEO || updatedType === ContentType.PODCAST)
    ) {
      validateMediaDraft({
        title: data.title ?? contentBelongsToUser.title,
        description: data.description ?? contentBelongsToUser.description,
        type: updatedType,
        categoryId: data.categoryId === undefined ? (contentBelongsToUser.categoryId ?? undefined) : data.categoryId,
        mediaUrl: data.mediaUrl === undefined ? (contentBelongsToUser.mediaUrl ?? undefined) : data.mediaUrl,
        thumbnail: data.thumbnail === undefined ? (contentBelongsToUser.thumbnail ?? undefined) : data.thumbnail,
        duration: data.duration === undefined ? (contentBelongsToUser.duration ?? undefined) : data.duration,
        body: data.body === undefined ? (contentBelongsToUser.body ?? undefined) : data.body,
        readTime: data.readTime === undefined ? (contentBelongsToUser.readTime ?? undefined) : data.readTime,
      });
    }
    if (
      (updatedType === ContentType.ARTICLE || updatedType === ContentType.NEWS) &&
      !(data.categoryId ?? contentBelongsToUser.categoryId)
    )
      throw new BadRequestException('Content category is required');

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
    return (await this.withEngagementState([content], userId))[0];
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
