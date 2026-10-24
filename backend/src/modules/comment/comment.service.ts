import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ContentService } from '../content/content.service';
import { CreateCommentInput, UpdateCommentInput } from './dto/create-comment.input';
import { ContentStatus, Role } from '../../../prisma/generated/client';
import { publicAuthorSelect, publicContentInclude } from '../content/public-content.include';

@Injectable()
export class CommentService {
  constructor(
    private prismaService: PrismaService,
    private contentService: ContentService,
  ) {}

  async create(data: CreateCommentInput, userId: string) {
    const content = await this.contentService.findPublishedById(data.contentId);
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Validate parent comment if provided
    if (data.parentId) {
      const parentComment = await this.prismaService.comment.findFirst({
        where: { id: data.parentId, contentId: data.contentId },
      });
      if (!parentComment || parentComment.isDeleted) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parentComment.parentId) {
        throw new BadRequestException('Replies are limited to one level');
      }
    }

    return this.prismaService.comment.create({
      data: {
        text: data.text,
        contentId: data.contentId,
        parentId: data.parentId,
        userId,
      },
      include: {
        user: { select: publicAuthorSelect },
        content: { include: publicContentInclude },
        replies: { where: { content: { is: { status: ContentStatus.PUBLISHED } } } },
        parent: { include: { user: { select: publicAuthorSelect }, content: { include: publicContentInclude } } },
      },
    });
  }

  async findByContentId(contentId: string) {
    return this.prismaService.comment.findMany({
      where: {
        contentId,
        content: { is: { status: ContentStatus.PUBLISHED } },
        parentId: null, // Only top-level comments
      },
      include: {
        user: { select: publicAuthorSelect },
        content: { include: publicContentInclude },
        replies: {
          where: { contentId, content: { is: { status: ContentStatus.PUBLISHED } } },
          include: {
            user: { select: publicAuthorSelect },
            content: { include: publicContentInclude },
          },
        },
        parent: { include: { user: { select: publicAuthorSelect }, content: { include: publicContentInclude } } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const comment = await this.prismaService.comment.findFirst({
      where: { id, content: { is: { status: ContentStatus.PUBLISHED } } },
      include: {
        user: { select: publicAuthorSelect },
        content: { include: publicContentInclude },
        replies: {
          where: { content: { is: { status: ContentStatus.PUBLISHED } } },
          include: {
            user: { select: publicAuthorSelect },
            content: { include: publicContentInclude },
          },
        },
        parent: { include: { user: { select: publicAuthorSelect }, content: { include: publicContentInclude } } },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return {
      ...comment,
      parent: comment.parent?.contentId === comment.contentId ? comment.parent : null,
    };
  }

  async update(id: string, data: UpdateCommentInput, userId: string) {
    const comment = await this.prismaService.comment.findFirst({
      where: {
        id,
        userId, // User can only update their own comments
        isDeleted: false,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found or not authorized');
    }

    return this.prismaService.comment.update({
      where: { id },
      data: { text: data.text },
      include: {
        user: { select: publicAuthorSelect },
        content: { include: publicContentInclude },
        replies: { where: { content: { is: { status: ContentStatus.PUBLISHED } } } },
        parent: { include: { user: { select: publicAuthorSelect }, content: { include: publicContentInclude } } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const user = await this.prismaService.user.findUnique({ where: { id: userId }, select: { role: true } });
    const comment = await this.prismaService.comment.findFirst({
      where: {
        id,
        isDeleted: false,
        ...(user?.role.includes(Role.ADMIN) ? {} : { userId }),
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found or not authorized');
    }

    await this.prismaService.comment.update({
      where: { id },
      data: { text: '[deleted]', isDeleted: true },
    });

    return true;
  }
}
