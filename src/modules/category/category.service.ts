import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}

  create(data: CreateCategoryInput) {
    return this.prismaService.category.create({
      data: {
        name: data.name,
        parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
      },
      include: {
        children: true,
        parent: true,
        contents: true,
      },
    });
  }

  findAll() {
    return this.prismaService.category.findMany({
      include: {
        children: true,
        parent: true,
        contents: true,
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        contents: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, data: UpdateCategoryInput) {
    await this.findOne(id);

    return this.prismaService.category.update({
      where: { id },
      data: {
        name: data.name,
        parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
      },
      include: {
        children: true,
        parent: true,
        contents: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prismaService.category.delete({ where: { id } });
  }
}
