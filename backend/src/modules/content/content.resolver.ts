import { Resolver, Args, Query, Mutation } from '@nestjs/graphql';
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

@Resolver()
export class ContentResolver {
  constructor(private readonly contentService: ContentService) {}

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

  @UseGuards(AccessGuard)
  @Mutation(() => ContentModel)
  async createContent(@Args('data') data: CreateContentInput, @CurrentUser() userId: string) {
    return await this.contentService.create(data, userId);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => ContentModel)
  async updateContent(@Args() args: UpdateContentArgs, @CurrentUser() userId: string) {
    return await this.contentService.update(args.id, args.data, userId);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => Boolean)
  async removeContent(@Args() args: IdArgs, @CurrentUser() userId: string) {
    return await this.contentService.remove(args.id, userId);
  }
}
