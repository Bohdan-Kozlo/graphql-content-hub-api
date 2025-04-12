import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ContentService } from '../content/content.service';
import { CreateCommentInput } from './dto/create-comment.input';

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

    return this.prismaService.comment.create({
      data: {
        ...data,
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
}
