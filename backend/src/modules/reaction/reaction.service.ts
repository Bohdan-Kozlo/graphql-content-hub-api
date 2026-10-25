import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ToggleContentReactionInput } from './dto/toggle-content-reaction.input';
import { ContentService } from '../content/content.service';
import { ContentStatus, ReactionType } from '../../../prisma/generated/client';

@Injectable()
export class ReactionService {
  constructor(
    private prismaService: PrismaService,
    private contentService: ContentService,
  ) {}

  async toggleContentReaction(data: ToggleContentReactionInput, userId: string) {
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
      await this.prismaService.reaction.delete({
        where: {
          id: existingReaction.id,
        },
      });
    } else {
      await this.prismaService.reaction.create({
        data: {
          userId,
          contentId: data.contentId,
          type: data.type,
        },
      });
    }
    return this.reactionState(data.contentId, userId);
  }

  async savedContents(first: number, after: string | undefined, userId: string) {
    return this.contentService.findSavedPage(first, after, userId);
  }

  private async reactionState(contentId: string, userId: string) {
    const [likeCount, viewerReactions] = await Promise.all([
      this.prismaService.reaction.count({
        where: {
          contentId,
          type: ReactionType.LIKE,
          content: { is: { status: ContentStatus.PUBLISHED } },
        },
      }),
      this.prismaService.reaction.findMany({
        where: { userId, contentId, content: { is: { status: ContentStatus.PUBLISHED } } },
        select: { type: true },
      }),
    ]);
    const types = new Set(viewerReactions.map(({ type }) => type));
    return { contentId, likeCount, liked: types.has(ReactionType.LIKE), saved: types.has(ReactionType.SAVE) };
  }
}
