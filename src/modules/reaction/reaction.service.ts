import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ToggleReactionInput } from './dto/create-reaction.input';
import { ContentService } from '../content/content.service';
import { ReactionType } from '@prisma/client';

@Injectable()
export class ReactionService {
  constructor(
    private prismaService: PrismaService,
    private contentService: ContentService,
  ) {}

  async toggleReaction(data: ToggleReactionInput, userId: string) {
    const content = await this.contentService.findOneById(data.contentId);
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
          user: true,
          content: true,
        },
      });
      return { removed: false, reaction };
    }
  }

  async findByContentId(contentId: string) {
    return this.prismaService.reaction.findMany({
      where: { contentId },
      include: {
        user: true,
        content: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prismaService.reaction.findMany({
      where: { userId },
      include: {
        user: true,
        content: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getReactionCounts(contentId: string) {
    const reactions = await this.prismaService.reaction.groupBy({
      by: ['type'],
      where: { contentId },
      _count: {
        type: true,
      },
    });

    const counts = {
      LIKE: 0,
      DISLIKE: 0,
      SAVE: 0,
    };

    reactions.forEach((reaction) => {
      counts[reaction.type] = reaction._count.type;
    });

    return counts;
  }

  async hasUserReacted(contentId: string, userId: string, type: ReactionType) {
    const reaction = await this.prismaService.reaction.findUnique({
      where: {
        userId_contentId_type: {
          userId,
          contentId,
          type,
        },
      },
    });

    return !!reaction;
  }
}
