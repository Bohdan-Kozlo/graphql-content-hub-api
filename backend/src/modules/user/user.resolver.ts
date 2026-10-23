import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { UserService } from './user.service';
import { UserModel } from './dto/user.output';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UpdateOwnProfileInput } from './dto/update-own-profile.input';
import { PublicAuthorModel } from '../content/dto/public-author.model';
import { Roles } from '../../common/decorators/reles.decorator';
import { Role } from '../../../prisma/generated/client';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { IdArgs } from '../../common/dto/graphql-args';

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
  async user(@Args() args: IdArgs) {
    return await this.userService.findOne(args.id);
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
  async deleteUser(@Args() args: IdArgs) {
    return await this.userService.delete(args.id);
  }

  @UseGuards(AccessGuard)
  @Query(() => UserModel)
  async profile(@CurrentUser() userId: string) {
    return await this.userService.getUserProfile(userId);
  }

  @Query(() => PublicAuthorModel, { nullable: true })
  async publicProfile(@Args() args: IdArgs) {
    return this.userService.findPublicProfile(args.id);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => PublicAuthorModel)
  async updateProfile(@CurrentUser() userId: string, @Args('data') data: UpdateOwnProfileInput) {
    return await this.userService.updateOwnProfile(userId, data);
  }
}
