import { Resolver, Args, Mutation, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './dto/auth-response.output';
import { SignupInput } from './dto/signup.input';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Context } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie, verifySameOrigin } from './refresh-cookie';
import { Account } from './dto/account.output';
import { UserService } from '../user/user.service';
import { AccessGuard } from '../../common/guards/access.guard';
import { RefreshGuard } from '../../common/guards/refresh.guard';
import { PasswordRecoveryService } from './password-recovery.service';
import { RequestPasswordResetArgs, ResetPasswordArgs } from './dto/reset-password.args';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly passwordRecoveryService: PasswordRecoveryService,
  ) {}

  @Mutation(() => Boolean)
  async requestPasswordReset(
    @Args() args: RequestPasswordResetArgs,
    @Context() context: { req: Request },
  ): Promise<boolean> {
    this.checkOrigin(context.req);
    await this.passwordRecoveryService.request(args.email, context.req.ip ?? 'unknown');
    return true;
  }

  @Mutation(() => Boolean)
  async resetPassword(@Args() args: ResetPasswordArgs, @Context() context: { req: Request }): Promise<boolean> {
    this.checkOrigin(context.req);
    await this.passwordRecoveryService.reset(args.token, args.password);
    return true;
  }

  @UseGuards(AccessGuard)
  @Query(() => Account)
  async me(@CurrentUser() userId: string) {
    const user = await this.userService.findOne(userId);
    return { id: user.id, email: user.email, username: user.username, roles: user.role };
  }

  @Mutation(() => AuthResponse)
  async login(@Args('data') data: LoginInput, @Context() context: { req: Request; res: Response }) {
    this.checkOrigin(context.req);
    const tokens = await this.authService.login(data);
    setRefreshCookie(context.res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, account: tokens.account };
  }

  @Mutation(() => AuthResponse)
  async signup(@Args('data') data: SignupInput, @Context() context: { req: Request; res: Response }) {
    this.checkOrigin(context.req);
    const tokens = await this.authService.signup(data);
    setRefreshCookie(context.res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, account: tokens.account };
  }

  @UseGuards(AccessGuard)
  @Mutation(() => Boolean)
  async logout(@CurrentUser() userId: string, @Context() context: { req: Request; res: Response }) {
    this.checkOrigin(context.req);
    const result = await this.authService.logout(userId);
    clearRefreshCookie(context.res);
    return result;
  }

  @UseGuards(RefreshGuard)
  @Mutation(() => AuthResponse)
  async refreshTokens(@CurrentUser() userId: string, @Context() context: { req: Request; res: Response }) {
    this.checkOrigin(context.req);
    const tokens = await this.authService.refreshTokens(userId, readRefreshCookie(context.req) ?? '');
    setRefreshCookie(context.res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, account: tokens.account };
  }

  private checkOrigin(request: Request): void {
    try {
      verifySameOrigin(request);
    } catch {
      throw new ForbiddenException('Cross-origin session mutation denied');
    }
  }
}
