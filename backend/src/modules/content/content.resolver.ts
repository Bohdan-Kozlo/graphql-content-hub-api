import { Resolver, Args, Query, Mutation, Int } from '@nestjs/graphql';
import { ContentService } from './content.service';
import { ContentModel } from './dto/content.model';
import { CreateContentInput } from './dto/create-content.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { UpdateContentInput } from './dto/update-content.input';
import { ContentPageModel } from './dto/content-page.model';

@Resolver()
export class ContentResolver {
  constructor(private readonly contentService: ContentService) {}

  @Query(() => ContentModel, { nullable: true })
  async content(@Args('id') id: string) {
    return await this.contentService.findPublishedById(id);
  }

  @Query(() => ContentPageModel)
  async publishedContents(
    @Args('first', { type: () => Int, defaultValue: 12 }) first: number,
    @Args('after', { nullable: true }) after?: string,
  ) {
    return this.contentService.findPublishedPage(first, after);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => ContentModel)
  async createContent(@Args('data') data: CreateContentInput, @CurrentUser() userId: string) {
    return await this.contentService.create(data, userId);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => ContentModel)
  async updateContent(@Args('data') data: UpdateContentInput, @Args('id') id: string, @CurrentUser() userId: string) {
    return await this.contentService.update(id, data, userId);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => Boolean)
  async removeContent(@Args('id') id: string, @CurrentUser() userId: string) {
    return await this.contentService.remove(id, userId);
  }
}
