import { Resolver, Args, Query, Mutation } from '@nestjs/graphql';
import { ContentService } from './content.service';
import { ContentModel } from './dto/content.model';
import { CreateContentInput } from './dto/create-content.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from 'src/common/guards/access.guard';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import { UpdateContentInput } from './dto/update-content.input';

@Resolver()
export class ContentResolver {
  constructor(private readonly contentService: ContentService) {}

  @Query(() => ContentModel)
  async content(@Args('id') id: string) {
    return await this.contentService.findOneById(id);
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
  @Mutation(() => ContentModel)
  async removeContent(@Args('id') id: string, @CurrentUser() userId: string) {
    return await this.contentService.remove(id, userId);
  }
}
