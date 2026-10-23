import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../../../prisma/generated/client';
import { LoginInput } from './dto/login.input';
import { SignupInput } from './dto/signup.input';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email.trim().toLowerCase());
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    throw new BadRequestException('Invalid credentials');
  }

  async login(data: LoginInput) {
    const user = await this.validateUser(data.email, data.password);

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.role, user.authVersion);

    await this.redisService.setRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      account: { id: user.id, email: user.email, username: user.username, roles: user.role },
    };
  }

  async signup(data: SignupInput) {
    if (data.password.length < 8) throw new BadRequestException('Use at least eight characters');
    const email = data.email.trim().toLowerCase();
    const ifUserExists = await this.userService.findByEmail(email);
    if (ifUserExists) {
      throw new BadRequestException('Invalid credentials');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.userService.create({
      email,
      username: data.username,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.role, user.authVersion);

    await this.redisService.setRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      account: { id: user.id, email: user.email, username: user.username, roles: user.role },
    };
  }

  async logout(userId: string) {
    await this.redisService.deleteRefreshToken(userId);
    return true;
  }

  async refreshTokens(userId: string, presentedToken: string) {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
      user.id,
      user.role,
      user.authVersion,
    );

    if (!(await this.redisService.rotateRefreshToken(user.id, presentedToken, newRefreshToken))) {
      throw new UnauthorizedException('Invalid session');
    }

    return {
      accessToken,
      refreshToken: newRefreshToken,
      account: { id: user.id, email: user.email, username: user.username, roles: user.role },
    };
  }

  private async generateTokens(userId: string, roles: Role[], version: number) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ sub: userId, roles, version }),
      this.jwtService.signAsync(
        { sub: userId, roles, version, jti: randomUUID() },
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
