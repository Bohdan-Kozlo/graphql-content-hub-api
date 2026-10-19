import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ToggleReactionInput } from './dto/create-reaction.input';
import { ContentService } from '../content/content.service';
import { ContentStatus, ReactionType } from '../../../prisma/generated/client';
import { publicAuthorSelect, publicContentInclude } from '../content/public-content.include';

@Injectable()
export class ReactionService {
  constructor(
    private prismaService: PrismaService,
    private contentService: ContentService,
  ) {}

  async toggleReaction(data: ToggleReactionInput, userId: string) {
    const content = await this.contentService.findPublishedById(data.contentId);
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const existingReaction = await this.prismaService.reaction.findUnique({
      where: {
        userId_contentId_type: {
          userId,
          contentId: data.contentId,
          type: data.type,
        },
      },
    });

    if (existingReaction) {
      // Remove existing reaction
      await this.prismaService.reaction.delete({
        where: {
          id: existingReaction.id,
        },
      });
      return { removed: true, reaction: null };
    } else {
      // Create new reaction
      const reaction = await this.prismaService.reaction.create({
        data: {
          userId,
          contentId: data.contentId,
          type: data.type,
        },
        include: {
          user: { select: publicAuthorSelect },
          content: { include: publicContentInclude },
        },
      });
      return { removed: false, reaction };
    }
  }

  async findByContentId(contentId: string) {
    return this.prismaService.reaction.findMany({
      where: {
        contentId,
        type: { in: [ReactionType.LIKE, ReactionType.DISLIKE] },
        content: { is: { status: ContentStatus.PUBLISHED } },
      },
      include: {
        user: { select: publicAuthorSelect },
        content: { include: publicContentInclude },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prismaService.reaction.findMany({
      where: { userId, content: { is: { status: ContentStatus.PUBLISHED } } },
      include: {
        user: { select: publicAuthorSelect },
        content: { include: publicContentInclude },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getReactionCounts(contentId: string) {
    const reactions = await this.prismaService.reaction.groupBy({
      by: ['type'],
      where: {
        contentId,
        type: { in: [ReactionType.LIKE, ReactionType.DISLIKE] },
        content: { is: { status: ContentStatus.PUBLISHED } },
      },
      _count: {
        type: true,
      },
    });

    const counts = {
      LIKE: 0,
      DISLIKE: 0,
    };

    reactions.forEach((reaction) => {
      if (reaction.type === ReactionType.LIKE || reaction.type === ReactionType.DISLIKE) {
        counts[reaction.type] = reaction._count.type;
      }
    });

    return counts;
  }

  async hasUserReacted(contentId: string, userId: string, type: ReactionType) {
    const reaction = await this.prismaService.reaction.findFirst({
      where: {
        userId,
        contentId,
        type,
        content: { is: { status: ContentStatus.PUBLISHED } },
      },
    });

    return !!reaction;
  }
}
