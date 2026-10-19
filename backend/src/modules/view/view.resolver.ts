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

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Query(() => String)
  async mostViewedContent(@Args('limit', { defaultValue: 10 }) limit: number) {
    const content = await this.viewService.getMostViewedContent(limit);
    return JSON.stringify(content);
  }
}
