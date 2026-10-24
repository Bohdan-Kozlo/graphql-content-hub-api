import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export type GoogleIdentity = {
  subject: string;
  email?: string;
  verified: boolean;
  displayName: string;
  avatarUrl?: string;
};

@Injectable()
export class GoogleIdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(identity: GoogleIdentity): Promise<string> {
    if (!identity.subject) throw new UnauthorizedException('Google identity unavailable');
    const linked = await this.prisma.providerIdentity.findUnique({
      where: { provider_subject: { provider: 'google', subject: identity.subject } },
    });
    if (linked) return linked.userId;
    if (!identity.verified || !identity.email) throw new UnauthorizedException('Verified email required');

    const email = identity.email.trim().toLowerCase();
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
        if (existing) {
          const otherGoogle = await tx.providerIdentity.findFirst({
            where: { provider: 'google', userId: existing.id },
          });
          if (otherGoogle) throw new UnauthorizedException('Google identity conflict');
          await tx.providerIdentity.create({
            data: { provider: 'google', subject: identity.subject, userId: existing.id },
          });
          await tx.user.update({
            where: { id: existing.id },
            data: { username: identity.displayName, avatarUrl: identity.avatarUrl ?? null },
          });
          return existing.id;
        }
        const created = await tx.user.create({
          data: {
            email,
            username: identity.displayName,
            avatarUrl: identity.avatarUrl ?? null,
            password: null,
            role: ['USER'],
            providerIdentities: { create: { provider: 'google', subject: identity.subject } },
          },
        });
        return created.id;
      });
    } catch (error) {
      // Unique constraints also protect against racing callbacks and prevent a
      // provider subject from being reassigned after a conflicting attempt.
      throw error instanceof UnauthorizedException
        ? error
        : new UnauthorizedException('Google sign-in could not complete');
    }
  }
}
