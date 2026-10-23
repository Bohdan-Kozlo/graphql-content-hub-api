import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { PasswordRecoveryMailer } from './password-recovery.mailer';

const RESET_LIFETIME_MS = 30 * 60 * 1000;

function invalidResetLink(): GraphQLError {
  return new GraphQLError('Invalid or expired reset link', { extensions: { code: 'INVALID_RESET_TOKEN' } });
}

@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: PasswordRecoveryMailer,
    private readonly redis: RedisService,
  ) {}

  async request(rawEmail: string, ip: string): Promise<void> {
    const email = rawEmail.trim().toLowerCase();
    const emailKey = createHash('sha256').update(email).digest('hex');
    const ipKey = createHash('sha256').update(ip).digest('hex');
    const allowance = await this.redis.passwordResetAllowance(emailKey, ipKey);
    if (allowance === 'ip-limited') {
      throw new GraphQLError('Please try again later', { extensions: { code: 'RATE_LIMITED' } });
    }
    if (allowance === 'email-limited') return;
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true },
    });
    if (!user) return;

    const token = randomBytes(32).toString('base64url');
    void this.sendAndActivate(user.id, user.email, token);
  }

  private async sendAndActivate(userId: string, email: string, token: string): Promise<void> {
    try {
      await this.mailer.sendResetLink(email, token);
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordResetTokenHash: createHash('sha256').update(token).digest('hex'),
          passwordResetExpiresAt: new Date(Date.now() + RESET_LIFETIME_MS),
        },
      });
    } catch {
      this.logger.error('Password reset email could not be sent');
    }
  }

  async reset(token: string, password: string): Promise<void> {
    if (password.length < 8) throw new BadRequestException('Use at least eight characters');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findUnique({ where: { passwordResetTokenHash: tokenHash } });
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
      throw invalidResetLink();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await this.prisma.user.updateMany({
      where: { id: user.id, passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { gt: new Date() } },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        authVersion: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw invalidResetLink();
    try {
      await this.redis.deleteRefreshToken(user.id);
    } catch {
      // The incremented authVersion still invalidates every existing JWT.
      this.logger.error('Refresh session could not be removed after password reset');
    }
    try {
      await this.mailer.sendChangedNotice(user.email);
    } catch {
      this.logger.error('Password change notification could not be sent');
    }
  }
}
