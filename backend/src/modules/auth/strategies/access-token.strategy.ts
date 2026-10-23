import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../../../prisma/generated/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; roles: Role[]; version?: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { authVersion: true, role: true },
    });
    if (!user || user.authVersion !== (payload.version ?? 0)) throw new UnauthorizedException('Invalid session');
    return { userId: payload.sub, roles: user.role };
  }
}
