import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ContentService } from '../content/content.service';
import { CreateCommentInput, UpdateCommentInput } from './dto/create-comment.input';

@Injectable()
export class CommentService {
  constructor(
    private prismaService: PrismaService,
    private contentService: ContentService,
  ) {}

  async create(data: CreateCommentInput, userId: string) {
    const content = await this.contentService.findOneById(data.contentId);
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Validate parent comment if provided
    if (data.parentId) {
      const parentComment = await this.prismaService.comment.findUnique({
        where: { id: data.parentId },
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
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
        user: true,
        content: true,
        replies: true,
        parent: true,
      },
    });
  }

  async findByContentId(contentId: string) {
    return this.prismaService.comment.findMany({
      where: {
        contentId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: true,
        content: true,
        replies: {
          include: {
            user: true,
            replies: true,
          },
        },
        parent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const comment = await this.prismaService.comment.findUnique({
      where: { id },
      include: {
        user: true,
        content: true,
        replies: {
          include: {
            user: true,
            replies: true,
          },
        },
        parent: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(id: string, data: UpdateCommentInput, userId: string) {
    const comment = await this.prismaService.comment.findFirst({
      where: {
        id,
        userId, // User can only update their own comments
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found or not authorized');
    }

    return this.prismaService.comment.update({
      where: { id },
      data: { text: data.text },
      include: {
        user: true,
        content: true,
        replies: true,
        parent: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prismaService.comment.findFirst({
      where: {
        id,
        userId, // User can only delete their own comments
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found or not authorized');
    }

    await this.prismaService.comment.delete({
      where: { id },
    });

    return true;
  }
}
