import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ContentService } from '../content/content.service';
import { NotFoundException } from '@nestjs/common';
import { CreateCommentInput, UpdateCommentInput } from './dto/create-comment.input';

describe('CommentService', () => {
  let service: CommentService;
  let prismaService: jest.Mocked<PrismaService>;
  let contentService: jest.Mocked<ContentService>;

  const mockComment = {
    id: 'comment-1',
    text: 'Test comment',
    contentId: 'content-1',
    userId: 'user-1',
    parentId: null,
    createdAt: new Date(),
    user: { id: 'user-1', username: 'testuser' },
    content: { id: 'content-1', title: 'Test Content' },
    replies: [],
    parent: null,
  };

  const mockPrismaService = {
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockContentService = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
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

    service = module.get<CommentService>(CommentService);
    prismaService = module.get(PrismaService);
    contentService = module.get(ContentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCommentInput: CreateCommentInput = {
      contentId: 'content-1',
      text: 'Test comment',
    };

    it('should create a comment successfully', async () => {
      contentService.findOneById.mockResolvedValue({ id: 'content-1' } as any);
      prismaService.comment.create.mockResolvedValue(mockComment as any);

      const result = await service.create(createCommentInput, 'user-1');

      expect(contentService.findOneById).toHaveBeenCalledWith('content-1');
      expect(prismaService.comment.create).toHaveBeenCalledWith({
        data: {
          text: 'Test comment',
          contentId: 'content-1',
          parentId: undefined,
          userId: 'user-1',
        },
        include: {
          user: true,
          content: true,
          replies: true,
          parent: true,
        },
      });
      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundException if content not found', async () => {
      contentService.findOneById.mockResolvedValue(null);

      await expect(service.create(createCommentInput, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should validate parent comment when parentId is provided', async () => {
      const inputWithParent = { ...createCommentInput, parentId: 'parent-1' };
      contentService.findOneById.mockResolvedValue({ id: 'content-1' } as any);
      prismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.create(inputWithParent, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByContentId', () => {
    it('should return comments for a content', async () => {
      const comments = [mockComment];
      prismaService.comment.findMany.mockResolvedValue(comments as any);

      const result = await service.findByContentId('content-1');

      expect(prismaService.comment.findMany).toHaveBeenCalledWith({
        where: {
          contentId: 'content-1',
          parentId: null,
        },
        include: {
          user: true,
          content: true,
          replies: {
            include: {
              user: true,
              replies: true,
            },
          },
          parent: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(comments);
    });
  });

  describe('findOne', () => {
    it('should return a comment', async () => {
      prismaService.comment.findUnique.mockResolvedValue(mockComment as any);

      const result = await service.findOne('comment-1');

      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundException if comment not found', async () => {
      prismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('comment-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateInput: UpdateCommentInput = { text: 'Updated comment' };

    it('should update a comment', async () => {
      prismaService.comment.findFirst.mockResolvedValue(mockComment as any);
      prismaService.comment.update.mockResolvedValue({
        ...mockComment,
        text: 'Updated comment',
      } as any);

      const result = await service.update('comment-1', updateInput, 'user-1');

      expect(prismaService.comment.findFirst).toHaveBeenCalledWith({
        where: { id: 'comment-1', userId: 'user-1' },
      });
      expect(result.text).toBe('Updated comment');
    });

    it('should throw NotFoundException if comment not found or not authorized', async () => {
      prismaService.comment.findFirst.mockResolvedValue(null);

      await expect(service.update('comment-1', updateInput, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a comment', async () => {
      prismaService.comment.findFirst.mockResolvedValue(mockComment as any);
      prismaService.comment.delete.mockResolvedValue(mockComment as any);

      const result = await service.remove('comment-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should throw NotFoundException if comment not found or not authorized', async () => {
      prismaService.comment.findFirst.mockResolvedValue(null);

      await expect(service.remove('comment-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
