/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import nock from 'nock';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import type { GoogleIdentity } from '../src/modules/auth/google-identity.service';

describe('Google OAuth (HTTP)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const prefix = `google-${Date.now()}`;
  const originalRatePrefix = process.env.PASSWORD_RESET_RATE_PREFIX;
  const originalGoogleConfig = {
    id: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_CLIENT_SECRET,
    callback: process.env.GOOGLE_CALLBACK_URL,
  };
  const identity = {
    subject: `${prefix}-subject`,
    email: `${prefix}@example.com`,
    verified: true,
    displayName: 'Google Reader',
    avatarUrl: 'https://lh3.googleusercontent.com/avatar',
  };
  let currentIdentity: GoogleIdentity = identity;
  const cookie = (response: request.Response, name: string) =>
    (response.headers['set-cookie'] as unknown as string[] | undefined)
      ?.find((value) => value.startsWith(`${name}=`))
      ?.split(';')[0];

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client';
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://127.0.0.1:3000/auth/google/callback';
    process.env.PASSWORD_RESET_RATE_PREFIX = `password-reset:${prefix}`;
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
    await app.close();
    nock.cleanAll();
    if (originalRatePrefix === undefined) delete process.env.PASSWORD_RESET_RATE_PREFIX;
    else process.env.PASSWORD_RESET_RATE_PREFIX = originalRatePrefix;
    if (originalGoogleConfig.id === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalGoogleConfig.id;
    if (originalGoogleConfig.secret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
    else process.env.GOOGLE_CLIENT_SECRET = originalGoogleConfig.secret;
    if (originalGoogleConfig.callback === undefined) delete process.env.GOOGLE_CALLBACK_URL;
    else process.env.GOOGLE_CALLBACK_URL = originalGoogleConfig.callback;
  });

  function providerResponds() {
    nock('https://www.googleapis.com').post(/.*/).reply(200, {
      access_token: 'provider-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });
    nock('https://www.googleapis.com').get(/.*/).reply(200, {
      sub: currentIdentity.subject,
      email: currentIdentity.email,
      email_verified: currentIdentity.verified,
      name: currentIdentity.displayName,
      picture: currentIdentity.avatarUrl,
    });
  }

  async function authorize(returnTo = '/saved') {
    const started = await request(app.getHttpServer()).get('/auth/google').query({ returnTo });
    expect(started.status).toBe(302);
    expect(started.headers.location).toContain('accounts.google.com');
    const state = new URL(started.headers.location).searchParams.get('state');
    expect(state).toBeTruthy();
    return { state: state!, stateCookie: cookie(started, 'content_hub_google_state')! };
  }

  it('creates a USER, then refreshes the ordinary local session without an access token in the redirect', async () => {
    currentIdentity = identity;
    const { state, stateCookie } = await authorize();
    providerResponds();
    const google = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .query({ state, code: 'provider-code' })
      .set('Cookie', stateCookie);
    expect(google.status).toBe(302);
    expect(google.headers.location).toBe('/auth/google/complete?returnTo=%2Fsaved');
    expect(google.headers.location).not.toContain('accessToken');
    const refreshCookie = cookie(google, 'content_hub_refresh');
    expect(refreshCookie).toBeTruthy();
    expect((google.headers['set-cookie'] as unknown as string[]).join(';')).toContain('HttpOnly');
    const refreshed = await request(app.getHttpServer()).post('/graphql').set('Cookie', refreshCookie!).send({
      query: 'mutation { refreshTokens { accessToken account { email username roles } } }',
    });
    expect(refreshed.body.errors).toBeUndefined();
    expect(refreshed.body.data.refreshTokens.account).toEqual({
      email: identity.email,
      username: identity.displayName,
      roles: ['USER'],
    });
    const user = await prisma.user.findUnique({ where: { email: identity.email } });
    expect(user?.password).toBeNull();
    expect(user?.avatarUrl).toBe(identity.avatarUrl);
    const setPassword = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${refreshed.body.data.refreshTokens.accessToken}`)
      .send({ query: 'mutation { setFirstPassword(password: "new-password-123") }' });
    expect(setPassword.body.data.setFirstPassword).toBe(true);
    const protectedProfile = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${refreshed.body.data.refreshTokens.accessToken}`)
      .send({ query: '{ me { email roles } }' });
    expect(protectedProfile.body.data.me).toEqual({ email: identity.email, roles: ['USER'] });
    const secondCookie = cookie(refreshed, 'content_hub_refresh')!;
    const rotated = await request(app.getHttpServer()).post('/graphql').set('Cookie', secondCookie).send({
      query: 'mutation { refreshTokens { accessToken } }',
    });
    expect(rotated.body.errors).toBeUndefined();
    const replay = await request(app.getHttpServer()).post('/graphql').set('Cookie', secondCookie).send({
      query: 'mutation { refreshTokens { accessToken } }',
    });
    expect(replay.body.errors).toBeDefined();
    const signedOut = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${rotated.body.data.refreshTokens.accessToken}`)
      .set('Cookie', cookie(rotated, 'content_hub_refresh')!)
      .send({ query: 'mutation { logout }' });
    expect(signedOut.body.data.logout).toBe(true);
    const passwordLogin = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { login(data: { email: "${identity.email}", password: "new-password-123" }) { account { email } } }`,
      });
    expect(passwordLogin.body.data.login.account.email).toBe(identity.email);
  });

  it('links a verified email once, preserving the password and later manual profile edits', async () => {
    const email = `${prefix}-linked@example.com`;
    const signup = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { signup(data: { email: "${email}", username: "Original", password: "password123" }) { account { id } } }`,
      });
    expect(signup.body.errors).toBeUndefined();
    const userId = signup.body.data.signup.account.id as string;
    currentIdentity = { ...identity, subject: `${prefix}-linked-subject`, email };
    const first = await authorize();
    providerResponds();
    const linked = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .query({ state: first.state, code: 'provider-code' })
      .set('Cookie', first.stateCookie);
    expect(linked.headers.location).toContain('/auth/google/complete');
    const imported = await prisma.user.findUnique({ where: { id: userId } });
    expect(imported?.username).toBe('Google Reader');
    expect(imported?.avatarUrl).toBe(identity.avatarUrl);
    expect(imported?.email).toBe(email);
    expect(imported?.password).toBeTruthy();

    await prisma.user.update({
      where: { id: userId },
      data: { username: 'Chosen name', avatarUrl: 'https://example.com/manual.png' },
    });
    currentIdentity = {
      ...currentIdentity,
      displayName: 'Changed Google Name',
      avatarUrl: 'https://example.com/google-new.png',
      email: 'unrelated@example.com',
      verified: false,
    };
    const next = await authorize();
    providerResponds();
    const repeated = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .query({ state: next.state, code: 'provider-code' })
      .set('Cookie', next.stateCookie);
    expect(repeated.headers.location).toContain('/auth/google/complete');
    const unchanged = await prisma.user.findUnique({ where: { id: userId } });
    expect(unchanged?.username).toBe('Chosen name');
    expect(unchanged?.avatarUrl).toBe('https://example.com/manual.png');
    expect(unchanged?.email).toBe(email);
  });

  it('rejects an unverified new email and a conflicting Google identity', async () => {
    currentIdentity = {
      ...identity,
      subject: `${prefix}-unverified`,
      email: `${prefix}-unverified@example.com`,
      verified: false,
    };
    const unverified = await authorize();
    providerResponds();
    const rejected = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .query({ state: unverified.state, code: 'provider-code' })
      .set('Cookie', unverified.stateCookie);
    expect(rejected.headers.location).toBe('/login?google=failed');
    expect(cookie(rejected, 'content_hub_refresh')).toBeUndefined();

    currentIdentity = { ...identity, subject: `${prefix}-missing-email`, email: undefined, verified: false };
    const missing = await authorize();
    providerResponds();
    const missingEmail = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .query({ state: missing.state, code: 'provider-code' })
      .set('Cookie', missing.stateCookie);
    expect(missingEmail.headers.location).toBe('/login?google=failed');
    expect(cookie(missingEmail, 'content_hub_refresh')).toBeUndefined();

    currentIdentity = { ...identity, subject: `${prefix}-other-subject` };
    const conflict = await authorize();
    providerResponds();
    const denied = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .query({ state: conflict.state, code: 'provider-code' })
      .set('Cookie', conflict.stateCookie);
    expect(denied.headers.location).toBe('/login?google=failed');
    expect(cookie(denied, 'content_hub_refresh')).toBeUndefined();
  });

  it('rejects unsafe return paths and callbacks without a matching state', async () => {
    for (const returnTo of [
      '//evil.example',
      'https://evil.example',
      '/\\evil.example',
      '/%2F%2Fevil.example',
      '/%5Cevil.example',
      '/%GG',
    ]) {
      const started = await request(app.getHttpServer()).get('/auth/google').query({ returnTo });
      expect(started.headers.location).toBe('/login?google=failed');
      expect(cookie(started, 'content_hub_google_state')).toBeUndefined();
    }
    const callback = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .query({ state: 'invalid', code: 'code' });
    expect(callback.headers.location).toBe('/login?google=failed');
    expect(cookie(callback, 'content_hub_refresh')).toBeUndefined();
  });

  it('allows email recovery to establish the first password for a Google-only User', async () => {
    currentIdentity = {
      ...identity,
      subject: `${prefix}-recovery-subject`,
      email: `${prefix}-recovery@example.com`,
    };
    const started = await authorize();
    providerResponds();
    const created = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .query({ state: started.state, code: 'provider-code' })
      .set('Cookie', started.stateCookie);
    expect(created.headers.location).toContain('/auth/google/complete');
    const user = await prisma.user.findUnique({ where: { email: currentIdentity.email } });
    expect(user?.password).toBeNull();

    const requested = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { requestPasswordReset(email: "${currentIdentity.email}") }`,
      });
    expect(requested.body.data.requestPasswordReset).toBe(true);
    let token = '';
    await vi.waitFor(
      async () => {
        const inbox = (await (await fetch('http://127.0.0.1:8025/api/v1/messages')).json()) as {
          messages: Array<{ ID: string; To: Array<{ Address: string }> }>;
        };
        const message = inbox.messages.find((item) =>
          item.To.some((recipient) => recipient.Address === currentIdentity.email),
        );
        expect(message).toBeTruthy();
        const detail = (await (await fetch(`http://127.0.0.1:8025/api/v1/message/${message!.ID}`)).json()) as {
          Text: string;
        };
        const link = detail.Text.match(/https?:\/\/\S+/)?.[0];
        token = new URL(link!).searchParams.get('token') ?? '';
        expect(token).toBeTruthy();
      },
      { timeout: 5000 },
    );
    const reset = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($token: String!, $password: String!) { resetPassword(token: $token, password: $password) }',
        variables: { token, password: 'recovered-password-123' },
      });
    expect(reset.body.data.resetPassword).toBe(true);
    const login = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { login(data: { email: "${currentIdentity.email}", password: "recovered-password-123" }) { account { email } } }`,
      });
    expect(login.body.data.login.account.email).toBe(currentIdentity.email);
  });

  it('rejects cancellation without issuing a local session', async () => {
    const { state, stateCookie } = await authorize();
    const cancelled = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .query({ state, error: 'access_denied' })
      .set('Cookie', stateCookie);
    expect(cancelled.headers.location).toBe('/login?google=cancelled');
    expect(cookie(cancelled, 'content_hub_refresh')).toBeUndefined();
    const providerFailure = await authorize();
    const failed = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .query({ state: providerFailure.state, error: 'server_error' })
      .set('Cookie', providerFailure.stateCookie);
    expect(failed.headers.location).toBe('/login?google=failed');
    expect(cookie(failed, 'content_hub_refresh')).toBeUndefined();

    const exchange = await authorize();
    nock('https://www.googleapis.com').post(/.*/).reply(500, { error: 'server_error' });
    const exchangeFailed = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .query({ state: exchange.state, code: 'provider-code' })
      .set('Cookie', exchange.stateCookie);
    expect(exchangeFailed.headers.location).toBe('/login?google=failed');
    expect(cookie(exchangeFailed, 'content_hub_refresh')).toBeUndefined();
  });
});
