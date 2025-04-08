import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { UserService } from './user.service';
import { UserModel } from './dto/user.output';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => UserModel)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserModel)
  async createUser(@Args('data') data: CreateUserInput) {
    return await this.userService.create(data);
  }

  @Query(() => [UserModel])
  async users() {
    return await this.userService.findAll();
  }

  @Query(() => UserModel)
  async user(@Args('id') id: string) {
    return await this.userService.findOne(id);
  }

  @Mutation(() => UserModel)
  async updateUser(@Args('data') data: UpdateUserInput) {
    return await this.userService.update(data.id, data);
  }

  @Mutation(() => Boolean)
  async deleteUser(@Args('id') id: string) {
    return await this.userService.delete(id);
  }
}
