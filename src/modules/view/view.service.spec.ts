import { Test, TestingModule } from '@nestjs/testing';
import { ViewService } from './view.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ContentService } from '../content/content.service';
import { NotFoundException } from '@nestjs/common';
import { CreateViewInput } from './dto/create-view.input';

describe('ViewService', () => {
  let service: ViewService;
  let prismaService: jest.Mocked<PrismaService>;
  let contentService: jest.Mocked<ContentService>;

  const mockView = {
    id: 'view-1',
    userId: 'user-1',
    contentId: 'content-1',
    viewedAt: new Date(),
    duration: 120,
    user: { id: 'user-1', username: 'testuser' },
    content: { id: 'content-1', title: 'Test Content' },
  };

  const mockPrismaService = {
    view: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    content: {
      findMany: jest.fn(),
    },
  };

  const mockContentService = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViewService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ContentService,
          useValue: mockContentService,
        },
      ],
    }).compile();

    service = module.get<ViewService>(ViewService);
    prismaService = module.get(PrismaService);
    contentService = module.get(ContentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createInput: CreateViewInput = {
      contentId: 'content-1',
      duration: 120,
    };

    it('should create a view for authenticated user', async () => {
      contentService.findOneById.mockResolvedValue({ id: 'content-1' } as any);
      prismaService.view.create.mockResolvedValue(mockView as any);

      const result = await service.create(createInput, 'user-1');

      expect(prismaService.view.create).toHaveBeenCalledWith({
        data: {
          contentId: 'content-1',
          userId: 'user-1',
          duration: 120,
        },
        include: {
          user: true,
          content: true,
        },
      });
      expect(result).toEqual(mockView);
    });

    it('should create an anonymous view', async () => {
      const anonymousView = { ...mockView, userId: null };
      contentService.findOneById.mockResolvedValue({ id: 'content-1' } as any);
      prismaService.view.create.mockResolvedValue(anonymousView as any);

      const result = await service.create(createInput);

      expect(prismaService.view.create).toHaveBeenCalledWith({
        data: {
          contentId: 'content-1',
          userId: null,
          duration: 120,
        },
        include: {
          user: true,
          content: true,
        },
      });
      expect(result).toEqual(anonymousView);
    });

    it('should throw NotFoundException if content not found', async () => {
      contentService.findOneById.mockResolvedValue(null);

      await expect(service.create(createInput, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByContentId', () => {
    it('should return views for a content', async () => {
      const views = [mockView];
      prismaService.view.findMany.mockResolvedValue(views as any);

      const result = await service.findByContentId('content-1');

      expect(prismaService.view.findMany).toHaveBeenCalledWith({
        where: { contentId: 'content-1' },
        include: {
          user: true,
          content: true,
        },
        orderBy: {
          viewedAt: 'desc',
        },
      });
      expect(result).toEqual(views);
    });
  });

  describe('findByUserId', () => {
    it('should return views for a user', async () => {
      const views = [mockView];
      prismaService.view.findMany.mockResolvedValue(views as any);

      const result = await service.findByUserId('user-1');

      expect(prismaService.view.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          user: true,
          content: true,
        },
        orderBy: {
          viewedAt: 'desc',
        },
      });
      expect(result).toEqual(views);
    });
  });

  describe('getViewCount', () => {
    it('should return total view count for content', async () => {
      prismaService.view.count.mockResolvedValue(10);

      const result = await service.getViewCount('content-1');

      expect(prismaService.view.count).toHaveBeenCalledWith({
        where: { contentId: 'content-1' },
      });
      expect(result).toBe(10);
    });
  });

  describe('getUniqueViewCount', () => {
    it('should return unique view count', async () => {
      prismaService.view.groupBy.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }] as any);
      prismaService.view.count.mockResolvedValue(3); // anonymous views

      const result = await service.getUniqueViewCount('content-1');

      expect(result).toBe(5); // 2 unique users + 3 anonymous
    });
  });

  describe('getViewStats', () => {
    it('should return comprehensive view statistics', async () => {
      // Mock the calls in the correct order based on the service implementation
      service.getViewCount = jest.fn().mockResolvedValue(15);
      service.getUniqueViewCount = jest.fn().mockResolvedValue(5);

      prismaService.view.aggregate.mockResolvedValue({
        _avg: { duration: 150 },
      } as any);

      const result = await service.getViewStats('content-1');

      expect(result).toEqual({
        totalViews: 15,
        uniqueViews: 5,
        averageDuration: 150,
      });
    });
  });

  describe('getMostViewedContent', () => {
    it('should return most viewed content with view counts', async () => {
      const mockContentViews = [
        { contentId: 'content-1', _count: { contentId: 10 } },
        { contentId: 'content-2', _count: { contentId: 5 } },
      ];
      const mockContents = [
        {
          id: 'content-1',
          title: 'Popular Content',
          author: { id: 'user-1' },
          category: { id: 'cat-1' },
          tags: [],
        },
      ];

      prismaService.view.groupBy.mockResolvedValue(mockContentViews as any);
      prismaService.content.findMany.mockResolvedValue(mockContents as any);

      const result = await service.getMostViewedContent(2);

      expect(result[0]).toEqual({
        ...mockContents[0],
        viewCount: 10,
      });
    });
  });
});
