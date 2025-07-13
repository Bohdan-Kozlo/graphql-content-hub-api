import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { TagService } from './tag.service';
import { TagModel } from './dto/tag.model';
import { CreateTagInput, UpdateTagInput } from './dto/create-tag.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from 'src/common/guards/access.guard';
import { Roles } from 'src/common/decorators/reles.decorator';
import { Role } from 'prisma/generated';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Resolver(() => TagModel)
export class TagResolver {
  constructor(private readonly tagService: TagService) {}

  @Query(() => [TagModel])
  async tags() {
    return this.tagService.findAll();
  }

  @Query(() => TagModel)
  async tag(@Args('id') id: string) {
    return this.tagService.findOne(id);
  }

  @Query(() => TagModel, { nullable: true })
  async tagByName(@Args('name') name: string) {
    return this.tagService.findByName(name);
  }

  @Query(() => [TagModel])
  async popularTags(@Args('limit', { defaultValue: 10 }) limit: number) {
    return this.tagService.getPopularTags(limit);
  }

  @Roles(Role.EDITOR, Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Mutation(() => TagModel)
  async createTag(@Args('data') data: CreateTagInput) {
    return this.tagService.create(data);
  }

  @Roles(Role.EDITOR, Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Mutation(() => TagModel)
  async updateTag(
    @Args('id') id: string,
    @Args('data') data: UpdateTagInput,
  ) {
    return this.tagService.update(id, data);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Mutation(() => Boolean)
  async deleteTag(@Args('id') id: string) {
    return this.tagService.remove(id);
  }
}
