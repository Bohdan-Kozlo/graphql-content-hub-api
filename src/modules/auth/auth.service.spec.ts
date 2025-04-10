/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { RedisService } from '../../common/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

jest.mock('../../common/redis/redis.service');
jest.mock('@nestjs/jwt');
jest.mock('../user/user.service');

describe('AuthService', () => {
  let authService: AuthService;
  let redisService: jest.Mocked<RedisService>;
  let jwtService: jest.Mocked<JwtService>;
  let userService: jest.Mocked<UserService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, RedisService, JwtService, UserService, ConfigService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    redisService = module.get(RedisService) as jest.Mocked<RedisService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    userService = module.get(UserService) as jest.Mocked<UserService>;
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const mockUser = { email: 'test@example.com', password: 'hashedPassword' };
      userService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.validateUser('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException if credentials are invalid', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens for valid credentials', async () => {
      const mockUser = {
        id: 'userId',
        role: 'user',
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      userService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(authService as any, 'generateTokens').mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });

      const result = await authService.login({ email: 'test@example.com', password: 'password' });
      expect(result).toEqual({ accessToken: 'accessToken', refreshToken: 'refreshToken' });
    });

    it('should throw BadRequestException for invalid credentials', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('signup', () => {
    it('should return access and refresh tokens for new user', async () => {
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue({
        id: 'userId',
        role: 'user',
        email: 'test@example.com',
      } as any);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(authService as any, 'generateTokens').mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });

      const result = await authService.signup({
        email: 'test@example.com',
        password: 'password',
        username: 'testUserName',
      });

      expect(result).toEqual({ accessToken: 'accessToken', refreshToken: 'refreshToken' });
    });

    it('should throw BadRequestException if user already exists', async () => {
      userService.findByEmail.mockResolvedValue({ email: 'test@example.com' } as any);

      await expect(
        authService.signup({
          email: 'test@example.com',
          password: 'password',
          username: 'testUserName',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      redisService.deleteRefreshToken.mockResolvedValue(true as never);

      const result = await authService.logout('userId');
      expect(result).toBe(true);
      expect(redisService.deleteRefreshToken).toHaveBeenCalledWith('userId');
    });

    describe('refreshTokens', () => {
      it('should return new access and refresh tokens if user exists', async () => {
        const mockUser = { id: 'userId', role: 'user' };
        userService.findOne.mockResolvedValue(mockUser as any);
        redisService.deleteRefreshToken.mockResolvedValue(true as never);
        jest.spyOn(authService as any, 'generateTokens').mockResolvedValue({
          accessToken: 'newAccessToken',
          refreshToken: 'newRefreshToken',
        });
  
        const result = await authService.refreshTokens('userId');
        expect(result).toEqual({ accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' });
        expect(redisService.deleteRefreshToken).toHaveBeenCalledWith('userId');
        expect(redisService.setRefreshToken).toHaveBeenCalledWith('userId', 'newRefreshToken');
      });
    });
  });
});
