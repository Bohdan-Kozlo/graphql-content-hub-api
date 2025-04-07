import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { User } from 'prisma/generated';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async create(data: CreateUserInput): Promise<User> {
    return this.prismaService.user.create({ data });
  }
}
