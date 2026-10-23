import type { Request, Response } from 'express';

const COOKIE_NAME = 'content_hub_refresh';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function readRefreshCookie(request: Request): string | null {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const value = cookies.find((cookie) => cookie.trim().startsWith(`${COOKIE_NAME}=`));
  if (!value) return null;
  try {
    return decodeURIComponent(value.trim().slice(COOKIE_NAME.length + 1));
  } catch {
    return null;
  }
}

export function setRefreshCookie(response: Response, token: string): void {
  response.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/graphql',
    maxAge: SEVEN_DAYS,
  });
}

export function clearRefreshCookie(response: Response): void {
  response.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/graphql',
  });
}

export function verifySameOrigin(request: Request): void {
  const origin = request.headers.origin;
  // Non-browser GraphQL clients may omit Origin; browsers also send Fetch Metadata.
  const fetchSite = request.headers['sec-fetch-site'];
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    throw new Error('Cross-origin session mutation denied');
  }
  if (!origin) return;
  const host = request.headers.host;
  if (!host || new URL(origin).host !== host) {
    throw new Error('Cross-origin session mutation denied');
  }
}
