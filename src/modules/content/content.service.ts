import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateContentInput } from './dto/create-content.input';
import { UserService } from '../user/user.service';
import { UpdateContentInput } from './dto/update-content.input';

@Injectable()
export class ContentService {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService,
  ) {}

  async create(data: CreateContentInput, userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.prismaService.content.create({
      data: {
        ...data,
        authorId: userId,
      },
      include: {
        author: true,
        category: true,
        source: true,
        tags: true,
        comments: true,
        reactions: true,
        views: true,
      },
    });
  }

  async findOneById(id: string) {
    const content = await this.prismaService.content.findUnique({
      where: {
        id,
      },
      include: {
        author: true,
        category: true,
        source: true,
        tags: true,
        comments: true,
        reactions: true,
        views: true,
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return content;
  }

  async update(id: string, data: UpdateContentInput, userId: string) {
    const contentBelongsToUser = await this.prismaService.content.findFirst({
      where: {
        id,
        authorId: userId,
      },
    });

    if (!contentBelongsToUser) {
      throw new BadRequestException('Content does not belong to user');
    }

    return this.prismaService.content.update({
      where: {
        id,
      },
      data,
      include: {
        author: true,
        category: true,
        source: true,
        tags: true,
        comments: true,
        reactions: true,
        views: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const contentBelongsToUser = await this.prismaService.content.findFirst({
      where: {
        id,
        authorId: userId,
      },
    });

    if (!contentBelongsToUser) {
      throw new BadRequestException('Content does not belong to user');
    }

    const deletedContent = await this.prismaService.content.delete({
      where: {
        id,
      },
    });

    return deletedContent ? true : false;
  }
}
