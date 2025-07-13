import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { User } from 'prisma/generated';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async getUserProfile(userId: string) {
    return await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        profile: true,
        bio: true,
        avatarUrl: true,
        username: true,
        createdAt: true,
      },
    });
  }

  async create(data: CreateUserInput): Promise<User> {
    return await this.prismaService.user.create({ data });
  }

  async findAll(): Promise<User[]> {
    return await this.prismaService.user.findMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    return await this.prismaService.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prismaService.user.delete({ where: { id } });
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return false;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prismaService.user.findUnique({ where: { email } });
  }
}
