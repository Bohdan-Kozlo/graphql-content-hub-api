import { Test, TestingModule } from '@nestjs/testing';
import { ReactionService } from './reaction.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ContentService } from '../content/content.service';
import { NotFoundException } from '@nestjs/common';
import { ToggleReactionInput } from './dto/create-reaction.input';
import { ReactionType } from 'prisma/generated';

describe('ReactionService', () => {
  let service: ReactionService;
  let prismaService: jest.Mocked<PrismaService>;
  let contentService: jest.Mocked<ContentService>;

  const mockReaction = {
    id: 'reaction-1',
    userId: 'user-1',
    contentId: 'content-1',
    type: ReactionType.LIKE,
    createdAt: new Date(),
    user: { id: 'user-1', username: 'testuser' },
    content: { id: 'content-1', title: 'Test Content' },
  };

  const mockPrismaService = {
    reaction: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockContentService = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionService,
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

    service = module.get<ReactionService>(ReactionService);
    prismaService = module.get(PrismaService);
    contentService = module.get(ContentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleReaction', () => {
    const toggleInput: ToggleReactionInput = {
      contentId: 'content-1',
      type: ReactionType.LIKE,
    };

    it('should create a new reaction when none exists', async () => {
      contentService.findOneById.mockResolvedValue({ id: 'content-1' } as any);
      prismaService.reaction.findUnique.mockResolvedValue(null);
      prismaService.reaction.create.mockResolvedValue(mockReaction as any);

      const result = await service.toggleReaction(toggleInput, 'user-1');

      expect(prismaService.reaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          contentId: 'content-1',
          type: ReactionType.LIKE,
        },
        include: {
          user: true,
          content: true,
        },
      });
      expect(result.removed).toBe(false);
      expect(result.reaction).toEqual(mockReaction);
    });

    it('should remove existing reaction', async () => {
      contentService.findOneById.mockResolvedValue({ id: 'content-1' } as any);
      prismaService.reaction.findUnique.mockResolvedValue(mockReaction as any);
      prismaService.reaction.delete.mockResolvedValue(mockReaction as any);

      const result = await service.toggleReaction(toggleInput, 'user-1');

      expect(prismaService.reaction.delete).toHaveBeenCalledWith({
        where: { id: 'reaction-1' },
      });
      expect(result.removed).toBe(true);
      expect(result.reaction).toBe(null);
    });

    it('should throw NotFoundException if content not found', async () => {
      contentService.findOneById.mockResolvedValue(null);

      await expect(service.toggleReaction(toggleInput, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByContentId', () => {
    it('should return reactions for a content', async () => {
      const reactions = [mockReaction];
      prismaService.reaction.findMany.mockResolvedValue(reactions as any);

      const result = await service.findByContentId('content-1');

      expect(prismaService.reaction.findMany).toHaveBeenCalledWith({
        where: { contentId: 'content-1' },
        include: {
          user: true,
          content: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(reactions);
    });
  });

  describe('getReactionCounts', () => {
    it('should return reaction counts', async () => {
      const mockGroupBy = [
        { type: ReactionType.LIKE, _count: { type: 5 } },
        { type: ReactionType.DISLIKE, _count: { type: 2 } },
      ];
      prismaService.reaction.groupBy.mockResolvedValue(mockGroupBy as any);

      const result = await service.getReactionCounts('content-1');

      expect(result).toEqual({
        LIKE: 5,
        DISLIKE: 2,
        SAVE: 0,
      });
    });
  });

  describe('hasUserReacted', () => {
    it('should return true if user has reacted', async () => {
      prismaService.reaction.findUnique.mockResolvedValue(mockReaction as any);

      const result = await service.hasUserReacted('content-1', 'user-1', 'LIKE');

      expect(result).toBe(true);
    });

    it('should return false if user has not reacted', async () => {
      prismaService.reaction.findUnique.mockResolvedValue(null);

      const result = await service.hasUserReacted('content-1', 'user-1', 'LIKE');

      expect(result).toBe(false);
    });
  });
});
