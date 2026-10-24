import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import passport from 'passport';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { RedisService } from '../../common/redis/redis.service';
import { AuthService } from './auth.service';
import { GoogleIdentityService, type GoogleIdentity } from './google-identity.service';
import { setRefreshCookie } from './refresh-cookie';

const STATE_COOKIE = 'content_hub_google_state';

export function safeReturnTo(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')) return null;
    if ([...decoded].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return null;
    const parsed = new URL(value, 'https://content-hub.local');
    if (parsed.origin !== 'https://content-hub.local') return null;
    return value;
  } catch {
    return null;
  }
}

@Controller('auth/google')
export class GoogleAuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly auth: AuthService,
    private readonly identities: GoogleIdentityService,
  ) {}

  @Get()
  async start(@Query('returnTo') requestedReturnTo: string | undefined, @Req() req: Request, @Res() res: Response) {
    if (!this.configured()) return res.redirect('/login?google=unavailable');
    const returnTo = requestedReturnTo === undefined ? '/account' : safeReturnTo(requestedReturnTo);
    if (!returnTo) return res.redirect('/login?google=failed');
    const state = randomBytes(32).toString('base64url');
    await this.redis.createOAuthState(state, returnTo);
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/google/callback',
      maxAge: 600_000,
    });
    const challenge = passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
      state,
      session: false,
    }) as RequestHandler;
    challenge(req, res, (() => res.redirect('/login?google=failed')) as NextFunction);
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const cookie = req.headers.cookie
      ?.split(';')
      .find((item) => item.trim().startsWith(`${STATE_COOKIE}=`))
      ?.trim()
      .slice(STATE_COOKIE.length + 1);
    res.clearCookie(STATE_COOKIE, { path: '/auth/google/callback' });
    if (
      !state ||
      !cookie ||
      state.length !== cookie.length ||
      !timingSafeEqual(Buffer.from(state), Buffer.from(cookie))
    ) {
      return res.redirect('/login?google=failed');
    }
    const returnTo = await this.redis.consumeOAuthState(state);
    if (!returnTo || !safeReturnTo(returnTo)) return res.redirect('/login?google=failed');
    if (req.query.error) {
      return res.redirect(req.query.error === 'access_denied' ? '/login?google=cancelled' : '/login?google=failed');
    }

    const complete = passport.authenticate(
      'google',
      { session: false },
      async (error: unknown, identity: GoogleIdentity | false) => {
        if (error || !identity) return res.redirect('/login?google=failed');
        try {
          const userId = await this.identities.resolve(identity);
          const refreshToken = await this.auth.loginUser(userId);
          setRefreshCookie(res, refreshToken);
          return res.redirect(`/auth/google/complete?returnTo=${encodeURIComponent(returnTo)}`);
        } catch {
          return res.redirect('/login?google=failed');
        }
      },
    ) as RequestHandler;
    complete(req, res, (() => res.redirect('/login?google=failed')) as NextFunction);
  }

  private configured(): boolean {
    return Boolean(
      this.config.get<string>('GOOGLE_CLIENT_ID') &&
      this.config.get<string>('GOOGLE_CLIENT_SECRET') &&
      this.config.get<string>('GOOGLE_CALLBACK_URL'),
    );
  }
}
