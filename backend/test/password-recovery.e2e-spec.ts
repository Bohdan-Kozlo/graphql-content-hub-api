/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { PasswordRecoveryMailer } from '../src/modules/auth/password-recovery.mailer';

async function resetLinksFor(email: string): Promise<string[]> {
  const inbox = (await (await fetch('http://127.0.0.1:8025/api/v1/messages')).json()) as {
    messages: Array<{ ID: string; To: Array<{ Address: string }>; Subject: string }>;
  };
  const messages = inbox.messages.filter(
    (message) =>
      message.To.some((recipient) => recipient.Address === email) &&
      message.Subject === 'Reset your Content Hub password',
  );
  const links = await Promise.all(
    messages.map(async (message) => {
      const detail = (await (await fetch(`http://127.0.0.1:8025/api/v1/message/${message.ID}`)).json()) as {
        Text: string;
      };
      return detail.Text.match(/https?:\/\/\S+/)?.[0];
    }),
  );
  return links.filter((link): link is string => Boolean(link));
}

describe('Password recovery (GraphQL HTTP)', () => {
  let app: INestApplication;
  let resetToken: string;
  let oldAccessToken: string;
  let oldRefreshCookie: string;
  const email = `recovery-${Date.now()}@example.com`;
  const limitedEmail = `limited-${Date.now()}@example.com`;
  const shortPasswordEmail = `short-${Date.now()}@example.com`;
  const mixedCaseEmail = `Mixed-${Date.now()}@Example.COM`;
  const rotatingEmail = `rotating-${Date.now()}@example.com`;
  const expiredEmail = `expired-${Date.now()}@example.com`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.get(PrismaService).user.deleteMany({
      where: {
        email: {
          in: [
            email,
            limitedEmail,
            shortPasswordEmail,
            mixedCaseEmail.toLowerCase(),
            ` ${mixedCaseEmail} `,
            rotatingEmail,
            expiredEmail,
          ],
        },
      },
    });
    await app.close();
  });

  it('accepts a recovery request without revealing whether the account exists', async () => {
    const signup = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($data: SignupInput!) { signup(data: $data) { accessToken } }',
        variables: { data: { email, username: 'recovery reader', password: 'old-password-123' } },
      });
    expect(signup.body.errors).toBeUndefined();
    oldAccessToken = signup.body.data.signup.accessToken;
    oldRefreshCookie = signup.headers['set-cookie'][0].split(';')[0];

    const query = 'mutation($email: String!) { requestPasswordReset(email: $email) }';
    const known = await request(app.getHttpServer()).post('/graphql').send({ query, variables: { email } });
    const unknown = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables: { email: 'unknown-recovery@example.com' } });

    expect(known.body.errors).toBeUndefined();
    expect(known.body.data.requestPasswordReset).toBe(true);
    expect(unknown.body).toEqual(known.body);

    await vi.waitFor(
      async () => {
        const inboxResponse = await fetch('http://127.0.0.1:8025/api/v1/messages');
        const inbox = (await inboxResponse.json()) as {
          messages: Array<{ ID: string; To: Array<{ Address: string }>; Subject: string }>;
        };
        const messages = inbox.messages.filter((message) =>
          message.To.some((recipient) => recipient.Address === email),
        );
        expect(messages).toHaveLength(1);
        expect(messages[0].Subject).toBe('Reset your Content Hub password');
        const messageResponse = await fetch(`http://127.0.0.1:8025/api/v1/message/${messages[0].ID}`);
        const message = (await messageResponse.json()) as { Text: string };
        const link = message.Text.match(/https?:\/\/\S+/)?.[0];
        expect(link).toBeTruthy();
        resetToken = new URL(link!).searchParams.get('token')!;
      },
      { timeout: 5000 },
    );
  });

  it('changes the password once and rejects the old password and reused link', async () => {
    const query = 'mutation($token: String!, $password: String!) { resetPassword(token: $token, password: $password) }';
    await vi.waitFor(
      async () => {
        const changed = await request(app.getHttpServer())
          .post('/graphql')
          .send({ query, variables: { token: resetToken, password: 'new-password-123' } });
        expect(changed.body.errors).toBeUndefined();
        expect(changed.body.data.resetPassword).toBe(true);
      },
      { timeout: 5000 },
    );

    const loginQuery = 'mutation($data: LoginInput!) { login(data: $data) { accessToken } }';
    const oldLogin = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: loginQuery,
        variables: { data: { email, password: 'old-password-123' } },
      });
    expect(oldLogin.body.errors).toBeDefined();

    const oldSession = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${oldAccessToken}`)
      .send({ query: '{ me { id } }' });
    expect(oldSession.body.errors).toBeDefined();
    const oldRefresh = await request(app.getHttpServer())
      .post('/graphql')
      .set('Cookie', oldRefreshCookie)
      .send({ query: 'mutation { refreshTokens { accessToken } }' });
    expect(oldRefresh.body.errors).toBeDefined();

    const newLogin = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: loginQuery,
        variables: { data: { email, password: 'new-password-123' } },
      });
    expect(newLogin.body.data.login.accessToken).toBeTruthy();

    const replay = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables: { token: resetToken, password: 'another-password-123' } });
    expect(replay.body.errors).toBeDefined();
  });

  it('sends at most three reset links to one address in an hour', async () => {
    const signup = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($data: SignupInput!) { signup(data: $data) { accessToken } }',
        variables: { data: { email: limitedEmail, username: 'limited reader', password: 'password-123' } },
      });
    expect(signup.body.errors).toBeUndefined();
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: 'mutation($email: String!) { requestPasswordReset(email: $email) }',
          variables: { email: limitedEmail },
        });
      expect(response.body).toEqual({ data: { requestPasswordReset: true } });
    }

    await vi.waitFor(
      async () => {
        const inboxResponse = await fetch('http://127.0.0.1:8025/api/v1/messages');
        const inbox = (await inboxResponse.json()) as { messages: Array<{ To: Array<{ Address: string }> }> };
        expect(
          inbox.messages.filter((message) => message.To.some((recipient) => recipient.Address === limitedEmail)),
        ).toHaveLength(3);
      },
      { timeout: 5000 },
    );
  });

  it('rejects a short password at the API boundary', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($data: SignupInput!) { signup(data: $data) { accessToken } }',
        variables: { data: { email: shortPasswordEmail, username: 'short password', password: 'short' } },
      });
    expect(response.body.errors).toBeDefined();
  });

  it('treats mixed-case email as the same account for signup and login', async () => {
    const signup = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($data: SignupInput!) { signup(data: $data) { account { email } } }',
        variables: { data: { email: ` ${mixedCaseEmail} `, username: 'mixed case', password: 'password-123' } },
      });
    expect(signup.body.errors).toBeUndefined();
    expect(signup.body.data.signup.account.email).toBe(mixedCaseEmail.toLowerCase());

    const login = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($data: LoginInput!) { login(data: $data) { accessToken } }',
        variables: { data: { email: mixedCaseEmail, password: 'password-123' } },
      });
    expect(login.body.data.login.accessToken).toBeTruthy();
  });

  it('reports an invalid reset link without revealing whether it was used or expired', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($token: String!, $password: String!) { resetPassword(token: $token, password: $password) }',
        variables: { token: 'not-a-valid-reset-token', password: 'password-123' },
      });
    expect(response.body.errors[0].extensions.code).toBe('INVALID_RESET_TOKEN');
  });

  it('replaces an earlier link only after sending the newer email', async () => {
    const signup = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($data: SignupInput!) { signup(data: $data) { accessToken } }',
        variables: { data: { email: rotatingEmail, username: 'rotating reader', password: 'password-123' } },
      });
    expect(signup.body.errors).toBeUndefined();

    const query = 'mutation($email: String!) { requestPasswordReset(email: $email) }';
    await request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables: { email: rotatingEmail } });
    await vi.waitFor(async () => expect(await resetLinksFor(rotatingEmail)).toHaveLength(1), { timeout: 5000 });
    const firstToken = new URL((await resetLinksFor(rotatingEmail))[0]).searchParams.get('token');

    await request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables: { email: rotatingEmail } });
    await vi.waitFor(async () => expect(await resetLinksFor(rotatingEmail)).toHaveLength(2), { timeout: 5000 });
    const secondToken = new URL((await resetLinksFor(rotatingEmail))[0]).searchParams.get('token');
    expect(secondToken).not.toBe(firstToken);

    const existingHash = (await app.get(PrismaService).user.findUnique({ where: { email: rotatingEmail } }))
      ?.passwordResetTokenHash;
    const failedSend = vi
      .spyOn(app.get(PasswordRecoveryMailer), 'sendResetLink')
      .mockRejectedValueOnce(new Error('SMTP rejected message'));
    await request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables: { email: rotatingEmail } });
    await vi.waitFor(() => expect(failedSend).toHaveBeenCalledOnce());
    expect(
      (await app.get(PrismaService).user.findUnique({ where: { email: rotatingEmail } }))?.passwordResetTokenHash,
    ).toBe(existingHash);
    failedSend.mockRestore();

    const resetQuery =
      'mutation($token: String!, $password: String!) { resetPassword(token: $token, password: $password) }';
    const first = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: resetQuery,
        variables: { token: firstToken, password: 'new-password-123' },
      });
    expect(first.body.errors[0].extensions.code).toBe('INVALID_RESET_TOKEN');
    const second = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: resetQuery,
        variables: { token: secondToken, password: 'new-password-123' },
      });
    expect(second.body.data.resetPassword).toBe(true);
  });

  it('rejects an expired link and leaves the old password usable', async () => {
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($data: SignupInput!) { signup(data: $data) { accessToken } }',
        variables: { data: { email: expiredEmail, username: 'expired reader', password: 'old-password-123' } },
      });
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($email: String!) { requestPasswordReset(email: $email) }',
        variables: { email: expiredEmail },
      });
    await vi.waitFor(async () => expect(await resetLinksFor(expiredEmail)).toHaveLength(1), { timeout: 5000 });
    const token = new URL((await resetLinksFor(expiredEmail))[0]).searchParams.get('token');
    await app.get(PrismaService).user.update({
      where: { email: expiredEmail },
      data: { passwordResetExpiresAt: new Date(Date.now() - 1000) },
    });
    const expired = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($token: String!, $password: String!) { resetPassword(token: $token, password: $password) }',
        variables: { token, password: 'new-password-123' },
      });
    expect(expired.body.errors[0].extensions.code).toBe('INVALID_RESET_TOKEN');
    const login = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation($data: LoginInput!) { login(data: $data) { accessToken } }',
        variables: { data: { email: expiredEmail, password: 'old-password-123' } },
      });
    expect(login.body.data.login.accessToken).toBeTruthy();
  });

  it('asks the caller to try later after the IP request limit', async () => {
    const query = 'mutation($email: String!) { requestPasswordReset(email: $email) }';
    let rateLimited = false;
    for (let attempt = 0; attempt < 35; attempt++) {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: { email: `unknown-${attempt}@example.com` },
        });
      if (response.body.errors) {
        expect(response.body.errors[0].extensions.code).toBe('RATE_LIMITED');
        rateLimited = true;
        break;
      }
    }
    expect(rateLimited).toBe(true);
  });
});
