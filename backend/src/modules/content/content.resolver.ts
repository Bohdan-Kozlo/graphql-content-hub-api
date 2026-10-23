import { Resolver, Args, Query, Mutation } from '@nestjs/graphql';
import { ContentService } from './content.service';
import { ContentModel } from './dto/content.model';
import { CreateContentInput } from './dto/create-content.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { UpdateContentArgs } from './dto/update-content.args';
import { ContentPageModel } from './dto/content-page.model';
import { IdArgs } from '../../common/dto/graphql-args';
import { PublishedContentsArgs } from './dto/published-contents.args';

@Resolver()
export class ContentResolver {
  constructor(private readonly contentService: ContentService) {}

  @Query(() => ContentModel, { nullable: true })
  async content(@Args() args: IdArgs) {
    return await this.contentService.findPublishedById(args.id);
  }

  @Query(() => ContentPageModel)
  async publishedContents(@Args() args: PublishedContentsArgs) {
    return this.contentService.findPublishedPage(args.first, args.after, args);
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
