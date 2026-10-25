import { Resolver, Args, Query, Mutation, ResolveField, Parent, Int } from '@nestjs/graphql';
import { ContentService } from './content.service';
import { ContentModel } from './dto/content.model';
import { CreateContentInput } from './dto/create-content.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { OptionalAccessGuard } from '../../common/guards/optional-access.guard';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { UpdateContentArgs } from './dto/update-content.args';
import { ContentPageModel } from './dto/content-page.model';
import { IdArgs } from '../../common/dto/graphql-args';
import { PublishedContentsArgs } from './dto/published-contents.args';
import { ContentStatus, Role } from '../../../prisma/generated/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/reles.decorator';

@Resolver(() => ContentModel)
export class ContentResolver {
  constructor(private readonly contentService: ContentService) {}

  @ResolveField(() => Int)
  viewCount(@Parent() content: { id: string; status: ContentStatus; viewCount?: number }) {
    if (content.status !== ContentStatus.PUBLISHED) return 0;
    return content.viewCount ?? this.contentService.getPublishedViewCount(content.id);
  }

  @Query(() => ContentModel, { nullable: true })
  @UseGuards(OptionalAccessGuard)
  async content(@Args() args: IdArgs, @CurrentUser() userId: string | null) {
    return await this.contentService.findPublishedById(args.id, userId);
  }

  @Query(() => ContentPageModel)
  @UseGuards(OptionalAccessGuard)
  async publishedContents(@Args() args: PublishedContentsArgs, @CurrentUser() userId: string | null) {
    return this.contentService.findPublishedPage(args.first, args.after, args, userId);
  }

  @Query(() => [ContentModel])
  @UseGuards(AccessGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  myDrafts(@CurrentUser() userId: string) {
    return this.contentService.findOwnDrafts(userId);
  }

  @Query(() => ContentModel, { nullable: true })
  @UseGuards(AccessGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  myDraft(@Args() args: IdArgs, @CurrentUser() userId: string) {
    return this.contentService.findOwnDraft(args.id, userId);
  }

  @UseGuards(AccessGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @Mutation(() => ContentModel)
  async createContent(@Args('data') data: CreateContentInput, @CurrentUser() userId: string) {
    return await this.contentService.create(data, userId);
  }

  @UseGuards(AccessGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @Mutation(() => ContentModel)
  async updateContent(@Args() args: UpdateContentArgs, @CurrentUser() userId: string) {
    return await this.contentService.update(args.id, args.data, userId);
  }

  @UseGuards(AccessGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @Mutation(() => Boolean)
  async removeContent(@Args() args: IdArgs, @CurrentUser() userId: string) {
    return await this.contentService.remove(args.id, userId);
  }
}
