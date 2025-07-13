import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateTagInput, UpdateTagInput } from './dto/create-tag.input';

@Injectable()
export class TagService {
  constructor(private prismaService: PrismaService) {}

  async create(data: CreateTagInput) {
    try {
      return await this.prismaService.tag.create({
        data: {
          name: data.name,
        },
        include: {
          contents: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Tag with this name already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prismaService.tag.findMany({
      include: {
        contents: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const tag = await this.prismaService.tag.findUnique({
      where: { id },
      include: {
        contents: true,
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async findByName(name: string) {
    return this.prismaService.tag.findUnique({
      where: { name },
      include: {
        contents: true,
      },
    });
  }

  async update(id: string, data: UpdateTagInput) {
    const tag = await this.prismaService.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    try {
      return await this.prismaService.tag.update({
        where: { id },
        data: { name: data.name },
        include: {
          contents: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Tag with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const tag = await this.prismaService.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.prismaService.tag.delete({
      where: { id },
    });

    return true;
  }

  async getPopularTags(limit: number = 10) {
    const tags = await this.prismaService.tag.findMany({
      include: {
        _count: {
          select: { contents: true },
        },
      },
      orderBy: {
        contents: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return tags;
  }
}
