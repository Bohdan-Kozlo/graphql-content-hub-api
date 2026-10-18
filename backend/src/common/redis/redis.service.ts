import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private redis: Redis;

  private readonly SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: configService.getOrThrow<string>('REDIS_HOST'),
      port: configService.getOrThrow<number>('REDIS_PORT'),
    });
  }

  async setRefreshToken(userId: string, token: string) {
    await this.redis.set(`refresh:${userId}`, token, 'EX', this.SEVEN_DAYS_IN_SECONDS);
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return this.redis.get(`refresh:${userId}`);
  }

  async deleteRefreshToken(userId: string) {
    await this.redis.del(`refresh:${userId}`);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
