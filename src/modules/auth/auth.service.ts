import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { Role } from 'prisma/generated';
import { LoginInput } from './dto/login.input';
import { SignupInput } from './dto/signup.input';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    throw new BadRequestException('Invalid credentials');
  }

  async login(data: LoginInput) {
    const user = await this.validateUser(data.email, data.password);

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.role);

    await this.redisService.setRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async signup(data: SignupInput) {
    const ifUserExists = await this.userService.findByEmail(data.email);
    if (ifUserExists) {
      throw new BadRequestException('Invalid credentials');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.userService.create({
      ...data,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.role);

    await this.redisService.setRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    await this.redisService.deleteRefreshToken(userId);
    return true;
  }

  async refreshTokens(userId: string) {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    await this.redisService.deleteRefreshToken(userId);

    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(user.id, user.role);

    await this.redisService.setRefreshToken(user.id, newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  private async generateTokens(userId: string, role: Role) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ sub: userId, role }),
      this.jwtService.signAsync(
        { sub: userId, role },
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
