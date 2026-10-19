import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContentInput } from './dto/create-content.input';
import { UserService } from '../user/user.service';
import { UpdateContentInput } from './dto/update-content.input';
import { ContentStatus } from '../../../prisma/generated/client';
import { publicContentInclude } from './public-content.include';

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

    return this.prismaService.content.create({
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
  }

  async findPublishedById(id: string) {
    const content = await this.prismaService.content.findFirst({
      where: {
        id,
        status: ContentStatus.PUBLISHED,
      },
      include: publicContentInclude,
    });
    return content;
  }

  async findPublishedPage(first: number, after?: string) {
    if (!Number.isInteger(first) || first < 1 || first > 30) {
      throw new BadRequestException('Page size must be between 1 and 30');
    }

    if (after) {
      const cursor = await this.prismaService.content.findFirst({
        where: { id: after, status: ContentStatus.PUBLISHED },
        select: { id: true },
      });
      if (!cursor) throw new BadRequestException('Invalid catalog cursor');
    }

    const contents = await this.prismaService.content.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: first + 1,
      ...(after ? { cursor: { id: after }, skip: 1 } : {}),
      include: publicContentInclude,
    });
    const items = contents.slice(0, first);

    return {
      items,
      endCursor: items.at(-1)?.id ?? null,
      hasMore: contents.length > first,
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

    return this.prismaService.content.update({
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
