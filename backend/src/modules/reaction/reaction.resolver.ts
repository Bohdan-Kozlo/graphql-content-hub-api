import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ReactionService } from './reaction.service';
import { ContentReactionStateModel } from './dto/reaction.model';
import { ToggleContentReactionInput } from './dto/toggle-content-reaction.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { SavedContentsArgs } from './dto/saved-contents.args';
import { ContentPageModel } from '../content/dto/content-page.model';

@Resolver()
export class ReactionResolver {
  constructor(private readonly reactionService: ReactionService) {}

  @UseGuards(AccessGuard)
  @Mutation(() => ContentReactionStateModel)
  async toggleContentReaction(@Args('data') data: ToggleContentReactionInput, @CurrentUser() userId: string) {
    return this.reactionService.toggleContentReaction(data, userId);
  }

  @UseGuards(AccessGuard)
  @Query(() => ContentPageModel)
  async savedContents(@Args() args: SavedContentsArgs, @CurrentUser() userId: string) {
    return this.reactionService.savedContents(args.first, args.after, userId);
  }
}
