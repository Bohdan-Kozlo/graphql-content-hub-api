import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateSourceInput, UpdateSourceInput } from './dto/create-source.input';

@Injectable()
export class SourceService {
  constructor(private prismaService: PrismaService) {}

  create(data: CreateSourceInput) {
    return this.prismaService.source.create({ data });
  }

  findAll() {
    return this.prismaService.source.findMany({ include: { contents: true } });
  }

  findOne(id: string) {
    return this.prismaService.source.findUnique({ where: { id }, include: { contents: true } });
  }

  async update(id: string, data: UpdateSourceInput) {
    const exists = await this.prismaService.source.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Source not found');
    return this.prismaService.source.update({ where: { id }, data });
  }

  async remove(id: string) {
    const exists = await this.prismaService.source.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Source not found');
    await this.prismaService.source.delete({ where: { id } });
    return true;
  }
}
