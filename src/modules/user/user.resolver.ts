import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { UserService } from './user.service';
import { UserModel } from './dto/user.output';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { Roles } from 'src/common/decorators/reles.decorator';
import { Role } from 'prisma/generated';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from 'src/common/guards/access.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';

@Resolver(() => UserModel)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Mutation(() => UserModel)
  async createUser(@Args('data') data: CreateUserInput) {
    return await this.userService.create(data);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Query(() => [UserModel])
  async users() {
    return await this.userService.findAll();
  }

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Query(() => UserModel)
  async user(@Args('id') id: string) {
    return await this.userService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Mutation(() => UserModel)
  async updateUser(@Args('data') data: UpdateUserInput) {
    return await this.userService.update(data.id, data);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AccessGuard, RolesGuard)
  @Mutation(() => Boolean)
  async deleteUser(@Args('id') id: string) {
    return await this.userService.delete(id);
  }

  @UseGuards(AccessGuard)
  @Query(() => UserModel)
  async profile(@CurrentUser() userId: string) {
    return await this.userService.getUserProfile(userId);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => UserModel)
  async updateProfile(@CurrentUser() userId: string, @Args('data') data: UpdateUserInput) {
    return await this.userService.update(userId, data);
  }
}
