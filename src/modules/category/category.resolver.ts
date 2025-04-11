import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { CategoryService } from './category.service';
import { CategoryModel } from './dto/category.model';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from 'src/common/guards/access.guard';
import { Roles } from 'src/common/decorators/reles.decorator';
import { Role } from 'prisma/generated';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Resolver()
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(AccessGuard)
  @Query(() => [CategoryModel])
  async categories() {
    return this.categoryService.findAll();
  }

  @UseGuards(AccessGuard)
  @Mutation(() => CategoryModel)
  async createCategory(@Args('data') data: CreateCategoryInput) {
    return this.categoryService.create(data);
  }

  @UseGuards(AccessGuard)
  @Query(() => CategoryModel)
  async category(@Args('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => CategoryModel)
  async updateCategory(@Args('id') id: string, @Args('data') data: UpdateCategoryInput) {
    return this.categoryService.update(id, data);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  async deleteCategory(@Args('id') id: string) {
    return this.categoryService.remove(id);
  }
}
