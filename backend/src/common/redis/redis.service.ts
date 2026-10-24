import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private redis: Redis;
  private readonly passwordResetRatePrefix: string;

  private readonly SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

  constructor(private configService: ConfigService) {
    this.passwordResetRatePrefix = configService.get<string>('PASSWORD_RESET_RATE_PREFIX') ?? 'password-reset';
    this.redis = new Redis({
      host: configService.getOrThrow<string>('REDIS_HOST'),
      port: configService.getOrThrow<number>('REDIS_PORT'),
      db: Number(configService.get<string>('REDIS_DB') ?? 0),
    });
  }

  async setRefreshToken(userId: string, token: string) {
    await this.redis.set(`refresh:${userId}`, token, 'EX', this.SEVEN_DAYS_IN_SECONDS);
  }

  async deleteRefreshToken(userId: string) {
    await this.redis.del(`refresh:${userId}`);
  }

  async createOAuthState(state: string, returnTo: string): Promise<void> {
    await this.redis.set(`oauth:google:${state}`, returnTo, 'EX', 600);
  }

  async consumeOAuthState(state: string): Promise<string | null> {
    return this.redis.getdel(`oauth:google:${state}`);
  }

  async rotateRefreshToken(userId: string, oldToken: string, newToken: string): Promise<boolean> {
    const rotated = await this.redis.eval(
      "if redis.call('GET', KEYS[1]) == ARGV[1] then redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3]); return 1 else return 0 end",
      1,
      `refresh:${userId}`,
      oldToken,
      newToken,
      this.SEVEN_DAYS_IN_SECONDS,
    );
    return rotated === 1;
  }

  async passwordResetAllowance(emailKey: string, ipKey: string): Promise<'allowed' | 'email-limited' | 'ip-limited'> {
    const result = await this.redis.eval(
      `local ip = redis.call('INCR', KEYS[1])
       if ip == 1 then redis.call('EXPIRE', KEYS[1], 3600) end
       if ip > 30 then return 0 end
       local email = redis.call('INCR', KEYS[2])
       if email == 1 then redis.call('EXPIRE', KEYS[2], 3600) end
       if email > 3 then return 2 end
       return 1`,
      2,
      `${this.passwordResetRatePrefix}:ip:${ipKey}`,
      `${this.passwordResetRatePrefix}:email:${emailKey}`,
    );
    if (result === 0) return 'ip-limited';
    if (result === 2) return 'email-limited';
    return 'allowed';
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
