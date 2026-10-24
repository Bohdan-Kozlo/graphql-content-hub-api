import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { IdArgs } from '../../common/dto/graphql-args';
import { ContentPageModel } from '../content/dto/content-page.model';
import { PublicAuthorModel } from '../content/dto/public-author.model';
import { CategoryModel } from '../category/dto/category.model';
import { SourceModel } from '../source/dto/source.model';
import { FollowingPageArgs } from './dto/following-page.args';
import { SubscriptionService } from './subscription.service';

@Resolver()
@UseGuards(AccessGuard)
export class SubscriptionResolver {
  constructor(private readonly subscriptions: SubscriptionService) {}

  @Mutation(() => PublicAuthorModel)
  followAuthor(@Args() args: IdArgs, @CurrentUser() userId: string) {
    return this.subscriptions.followAuthor(userId, args.id);
  }

  @Mutation(() => CategoryModel)
  followCategory(@Args() args: IdArgs, @CurrentUser() userId: string) {
    return this.subscriptions.followCategory(userId, args.id);
  }

  @Mutation(() => SourceModel)
  followSource(@Args() args: IdArgs, @CurrentUser() userId: string) {
    return this.subscriptions.followSource(userId, args.id);
  }

  @Mutation(() => Boolean)
  unfollowAuthor(@Args() args: IdArgs, @CurrentUser() userId: string) {
    return this.subscriptions.unfollowAuthor(userId, args.id);
  }

  @Mutation(() => Boolean)
  unfollowCategory(@Args() args: IdArgs, @CurrentUser() userId: string) {
    return this.subscriptions.unfollowCategory(userId, args.id);
  }

  @Mutation(() => Boolean)
  unfollowSource(@Args() args: IdArgs, @CurrentUser() userId: string) {
    return this.subscriptions.unfollowSource(userId, args.id);
  }

  @Query(() => [PublicAuthorModel])
  myFollowedAuthors(@CurrentUser() userId: string) {
    return this.subscriptions.myFollowedAuthors(userId);
  }

  @Query(() => [CategoryModel])
  myFollowedCategories(@CurrentUser() userId: string) {
    return this.subscriptions.myFollowedCategories(userId);
  }

  @Query(() => [SourceModel])
  myFollowedSources(@CurrentUser() userId: string) {
    return this.subscriptions.myFollowedSources(userId);
  }

  @Query(() => ContentPageModel)
  followingFeed(@Args() args: FollowingPageArgs, @CurrentUser() userId: string) {
    return this.subscriptions.followingFeed(userId, args.first, args.after);
  }
}
