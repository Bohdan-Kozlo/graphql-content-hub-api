import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateViewInput } from './dto/create-view.input';
import { ContentService } from '../content/content.service';

@Injectable()
export class ViewService {
  constructor(
    private prismaService: PrismaService,
    private contentService: ContentService,
  ) {}

  async create(data: CreateViewInput, userId?: string) {
    const content = await this.contentService.findOneById(data.contentId);
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return this.prismaService.view.create({
      data: {
        contentId: data.contentId,
        userId: userId || null,
        duration: data.duration,
      },
      include: {
        user: true,
        content: true,
      },
    });
  }

  async findByContentId(contentId: string) {
    return this.prismaService.view.findMany({
      where: { contentId },
      include: {
        user: true,
        content: true,
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prismaService.view.findMany({
      where: { userId },
      include: {
        user: true,
        content: true,
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });
  }

  async getViewCount(contentId: string) {
    return this.prismaService.view.count({
      where: { contentId },
    });
  }

  async getUniqueViewCount(contentId: string) {
    const uniqueViews = await this.prismaService.view.groupBy({
      by: ['userId'],
      where: {
        contentId,
        userId: { not: null },
      },
    });

    const anonymousViews = await this.prismaService.view.count({
      where: {
        contentId,
        userId: null,
      },
    });

    return uniqueViews.length + anonymousViews;
  }

  async getViewStats(contentId: string) {
    const totalViews = await this.getViewCount(contentId);
    const uniqueViews = await this.getUniqueViewCount(contentId);
    
    const avgDuration = await this.prismaService.view.aggregate({
      where: { 
        contentId,
        duration: { not: null },
      },
      _avg: {
        duration: true,
      },
    });

    return {
      totalViews,
      uniqueViews,
      averageDuration: avgDuration._avg.duration || 0,
    };
  }

  async getMostViewedContent(limit: number = 10) {
    const contentViews = await this.prismaService.view.groupBy({
      by: ['contentId'],
      _count: {
        contentId: true,
      },
      orderBy: {
        _count: {
          contentId: 'desc',
        },
      },
      take: limit,
    });

    const contentIds = contentViews.map(cv => cv.contentId);
    const contents = await this.prismaService.content.findMany({
      where: {
        id: { in: contentIds },
      },
      include: {
        author: true,
        category: true,
        tags: true,
      },
    });

    return contents.map(content => {
      const viewCount = contentViews.find(cv => cv.contentId === content.id)?._count.contentId || 0;
      return {
        ...content,
        viewCount,
      };
    });
  }
}
