import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateViewInput } from './dto/create-view.input';
import { ContentService } from '../content/content.service';
import { ContentStatus } from '../../../prisma/generated/client';
import { publicAuthorSelect, publicContentInclude } from '../content/public-content.include';

@Injectable()
export class ViewService {
  constructor(
    private prismaService: PrismaService,
    private contentService: ContentService,
  ) {}

  async create(data: CreateViewInput, userId?: string) {
    const content = await this.contentService.findPublishedById(data.contentId);
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
        user: { select: publicAuthorSelect },
        content: { include: publicContentInclude },
      },
    });
  }

  async findByContentId(contentId: string) {
    return this.prismaService.view.findMany({
      where: { contentId, content: { is: { status: ContentStatus.PUBLISHED } } },
      include: {
        user: { select: publicAuthorSelect },
        content: { include: publicContentInclude },
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prismaService.view.findMany({
      where: { userId, content: { is: { status: ContentStatus.PUBLISHED } } },
      include: {
        user: { select: publicAuthorSelect },
        content: { include: publicContentInclude },
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });
  }

  async getViewCount(contentId: string) {
    return this.prismaService.view.count({
      where: { contentId, content: { is: { status: ContentStatus.PUBLISHED } } },
    });
  }

  async getUniqueViewCount(contentId: string) {
    const uniqueViews = await this.prismaService.view.groupBy({
      by: ['userId'],
      where: {
        contentId,
        userId: { not: null },
        content: { is: { status: ContentStatus.PUBLISHED } },
      },
    });

    const anonymousViews = await this.prismaService.view.count({
      where: {
        contentId,
        userId: null,
        content: { is: { status: ContentStatus.PUBLISHED } },
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
        content: { is: { status: ContentStatus.PUBLISHED } },
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
      where: { content: { is: { status: ContentStatus.PUBLISHED } } },
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

    const contentIds = contentViews.map((cv) => cv.contentId);
    const contents = await this.prismaService.content.findMany({
      where: {
        id: { in: contentIds },
        status: ContentStatus.PUBLISHED,
      },
      select: {
        id: true,
        title: true,
        type: true,
        publishedAt: true,
      },
    });

    return contents.map((content) => {
      const viewCount = contentViews.find((cv) => cv.contentId === content.id)?._count.contentId || 0;
      return {
        ...content,
        viewCount,
      };
    });
  }
}
