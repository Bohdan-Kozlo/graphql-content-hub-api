import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from 'src/common/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/user.service';
import * as bcrypt from 'bcrypt';
import { Role } from 'prisma/generated';
import { LoginInput } from './dto/login.input';
import { SignupInput } from './dto/signup.input';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
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

    const { accessToken, refreshToken } = await this.genereteTokens(user.id, user.role);

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

    const { accessToken, refreshToken } = await this.genereteTokens(user.id, user.role);

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

  async refreshTokens(userId: string, refreshToken: string) {
    const storedRefreshToken = await this.redisService.getRefreshToken(userId);
    if (storedRefreshToken !== refreshToken) {
      throw new BadRequestException('Invalid refresh token');
    }

    const user = await this.userService.findOne(userId);

    return this.login({ email: user.email, password: user.password });
  }

  private async genereteTokens(userId: string, role: Role) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ sub: userId, role }),
      this.jwtService.signAsync(
        { sub: userId, role },
        {
          secret: 'refreshToken',
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
