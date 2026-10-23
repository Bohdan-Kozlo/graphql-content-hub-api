import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ReactionService } from './reaction.service';
import { ReactionModel } from './dto/reaction.model';
import { ToggleReactionInput } from './dto/create-reaction.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { ContentIdArgs } from '../../common/dto/graphql-args';
import { HasUserReactedArgs } from './dto/has-user-reacted.args';

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
  async reactionsByContent(@Args() args: ContentIdArgs) {
    return this.reactionService.findByContentId(args.contentId);
  }

  @UseGuards(AccessGuard)
  @Query(() => [ReactionModel])
  async myReactions(@CurrentUser('id') userId: string) {
    return this.reactionService.findByUserId(userId);
  }

  @Query(() => String)
  async reactionCounts(@Args() args: ContentIdArgs) {
    const counts = await this.reactionService.getReactionCounts(args.contentId);
    return JSON.stringify(counts);
  }

  @UseGuards(AccessGuard)
  @Query(() => Boolean)
  async hasUserReacted(@Args() args: HasUserReactedArgs, @CurrentUser('id') userId: string) {
    return this.reactionService.hasUserReacted(args.contentId, userId, args.type);
  }
}
