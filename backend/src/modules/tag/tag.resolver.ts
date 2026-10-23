import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { TagService } from './tag.service';
import { TagModel } from './dto/tag.model';
import { CreateTagInput } from './dto/create-tag.input';
import { UpdateTagArgs } from './dto/update-tag.args';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { Roles } from '../../common/decorators/reles.decorator';
import { Role } from '../../../prisma/generated/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IdArgs, LimitArgs, NameArgs } from '../../common/dto/graphql-args';

@Resolver(() => TagModel)
export class TagResolver {
  constructor(private readonly tagService: TagService) {}

  @Query(() => [TagModel])
  async tags() {
    return this.tagService.findAll();
  }

  @Query(() => TagModel)
  async tag(@Args() args: IdArgs) {
    return this.tagService.findOne(args.id);
  }

  @Query(() => TagModel, { nullable: true })
  async tagByName(@Args() args: NameArgs) {
    return this.tagService.findByName(args.name);
  }

  @Query(() => [TagModel])
  async popularTags(@Args() args: LimitArgs) {
    return this.tagService.getPopularTags(args.limit);
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
  async updateTag(@Args() args: UpdateTagArgs) {
    return this.tagService.update(args.id, args.data);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Mutation(() => Boolean)
  async deleteTag(@Args() args: IdArgs) {
    return this.tagService.remove(args.id);
  }
}
