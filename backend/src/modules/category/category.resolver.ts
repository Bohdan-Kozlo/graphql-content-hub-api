import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { CategoryService } from './category.service';
import { CategoryModel } from './dto/category.model';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryArgs } from './dto/update-category.args';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { Roles } from '../../common/decorators/reles.decorator';
import { Role } from '../../../prisma/generated/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IdArgs } from '../../common/dto/graphql-args';

@Resolver()
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Query(() => [CategoryModel])
  async categories() {
    return this.categoryService.findAll();
  }

  @UseGuards(AccessGuard)
  @Mutation(() => CategoryModel)
  async createCategory(@Args('data') data: CreateCategoryInput) {
    return this.categoryService.create(data);
  }

  @Query(() => CategoryModel)
  async category(@Args() args: IdArgs) {
    return this.categoryService.findOne(args.id);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => CategoryModel)
  async updateCategory(@Args() args: UpdateCategoryArgs) {
    return this.categoryService.update(args.id, args.data);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  async deleteCategory(@Args() args: IdArgs) {
    return this.categoryService.remove(args.id);
  }
}
