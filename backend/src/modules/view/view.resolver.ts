import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ViewService } from './view.service';
import { ViewModel } from './dto/view.model';
import { CreateViewInput } from './dto/create-view.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { Roles } from '../../common/decorators/reles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../../prisma/generated/client';
import { ContentIdArgs, LimitArgs } from '../../common/dto/graphql-args';

@Resolver(() => ViewModel)
export class ViewResolver {
  constructor(private readonly viewService: ViewService) {}

  @Mutation(() => ViewModel)
  async createView(@Args('data') data: CreateViewInput, @CurrentUser('id') userId?: string) {
    return this.viewService.create(data, userId);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Query(() => [ViewModel])
  async viewsByContent(@Args() args: ContentIdArgs) {
    return this.viewService.findByContentId(args.contentId);
  }

  @UseGuards(AccessGuard)
  @Query(() => [ViewModel])
  async myViews(@CurrentUser('id') userId: string) {
    return this.viewService.findByUserId(userId);
  }

  @Query(() => Number)
  async viewCount(@Args() args: ContentIdArgs) {
    return this.viewService.getViewCount(args.contentId);
  }

  @Query(() => Number)
  async uniqueViewCount(@Args() args: ContentIdArgs) {
    return this.viewService.getUniqueViewCount(args.contentId);
  }

  @Query(() => String)
  async viewStats(@Args() args: ContentIdArgs) {
    const stats = await this.viewService.getViewStats(args.contentId);
    return JSON.stringify(stats);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Query(() => String)
  async mostViewedContent(@Args() args: LimitArgs) {
    const content = await this.viewService.getMostViewedContent(args.limit);
    return JSON.stringify(content);
  }
}
