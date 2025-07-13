import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ViewService } from './view.service';
import { ViewModel } from './dto/view.model';
import { CreateViewInput } from './dto/create-view.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from 'src/common/guards/access.guard';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';

@Resolver(() => ViewModel)
export class ViewResolver {
  constructor(private readonly viewService: ViewService) {}

  @Mutation(() => ViewModel)
  async createView(
    @Args('data') data: CreateViewInput,
    @CurrentUser('id') userId?: string,
  ) {
    return this.viewService.create(data, userId);
  }

  @Query(() => [ViewModel])
  async viewsByContent(@Args('contentId') contentId: string) {
    return this.viewService.findByContentId(contentId);
  }

  @UseGuards(AccessGuard)
  @Query(() => [ViewModel])
  async myViews(@CurrentUser('id') userId: string) {
    return this.viewService.findByUserId(userId);
  }

  @Query(() => Number)
  async viewCount(@Args('contentId') contentId: string) {
    return this.viewService.getViewCount(contentId);
  }

  @Query(() => Number)
  async uniqueViewCount(@Args('contentId') contentId: string) {
    return this.viewService.getUniqueViewCount(contentId);
  }

  @Query(() => String)
  async viewStats(@Args('contentId') contentId: string) {
    const stats = await this.viewService.getViewStats(contentId);
    return JSON.stringify(stats);
  }

  @Query(() => String)
  async mostViewedContent(@Args('limit', { defaultValue: 10 }) limit: number) {
    const content = await this.viewService.getMostViewedContent(limit);
    return JSON.stringify(content);
  }
}
