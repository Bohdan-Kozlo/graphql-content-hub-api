import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ReactionService } from './reaction.service';
import { ReactionModel } from './dto/reaction.model';
import { ToggleReactionInput } from './dto/create-reaction.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from 'src/common/guards/access.guard';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import { ReactionType } from '@prisma/client';

@Resolver(() => ReactionModel)
export class ReactionResolver {
  constructor(private readonly reactionService: ReactionService) {}

  @UseGuards(AccessGuard)
  @Mutation(() => Boolean)
  async toggleReaction(@Args('data') data: ToggleReactionInput, @CurrentUser('id') userId: string) {
    const result = await this.reactionService.toggleReaction(data, userId);
    return !result.removed; // Return true if reaction was added, false if removed
  }

  @Query(() => [ReactionModel])
  async reactionsByContent(@Args('contentId') contentId: string) {
    return this.reactionService.findByContentId(contentId);
  }

  @UseGuards(AccessGuard)
  @Query(() => [ReactionModel])
  async myReactions(@CurrentUser('id') userId: string) {
    return this.reactionService.findByUserId(userId);
  }

  @Query(() => String)
  async reactionCounts(@Args('contentId') contentId: string) {
    const counts = await this.reactionService.getReactionCounts(contentId);
    return JSON.stringify(counts);
  }

  @UseGuards(AccessGuard)
  @Query(() => Boolean)
  async hasUserReacted(
    @Args('contentId') contentId: string,
    @Args('type') type: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reactionService.hasUserReacted(contentId, userId, type as ReactionType);
  }
}
