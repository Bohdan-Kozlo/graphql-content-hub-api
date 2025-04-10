import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './dto/auth-response.output';
import { SignupInput } from './dto/signup.input';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { RefreshGuard } from '../../common/guards/refresh.guard';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async login(@Args('data') data: LoginInput) {
    return await this.authService.login(data);
  }

  @Mutation(() => AuthResponse)
  async signup(@Args('data') data: SignupInput) {
    return await this.authService.signup(data);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => Boolean)
  async logout(@CurrentUser() userId: string) {
    return await this.authService.logout(userId);
  }

  @UseGuards(RefreshGuard)
  @Mutation(() => AuthResponse)
  async refreshTokens(@CurrentUser() userId: string) {
    return await this.authService.refreshTokens(userId);
  }
}
