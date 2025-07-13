import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from './tag.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateTagInput, UpdateTagInput } from './dto/create-tag.input';

describe('TagService', () => {
  let service: TagService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockTag = {
    id: 'tag-1',
    name: 'Technology',
    contents: [],
  };

  const mockPrismaService = {
    tag: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createInput: CreateTagInput = { name: 'Technology' };

    it('should create a tag successfully', async () => {
      prismaService.tag.create.mockResolvedValue(mockTag as any);

      const result = await service.create(createInput);

      expect(prismaService.tag.create).toHaveBeenCalledWith({
        data: { name: 'Technology' },
        include: { contents: true },
      });
      expect(result).toEqual(mockTag);
    });

    it('should throw ConflictException for duplicate name', async () => {
      const error = new Error();
      (error as any).code = 'P2002';
      prismaService.tag.create.mockRejectedValue(error);

      await expect(service.create(createInput)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all tags', async () => {
      const tags = [mockTag];
      prismaService.tag.findMany.mockResolvedValue(tags as any);

      const result = await service.findAll();

      expect(prismaService.tag.findMany).toHaveBeenCalledWith({
        include: { contents: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(tags);
    });
  });

  describe('findOne', () => {
    it('should return a tag', async () => {
      prismaService.tag.findUnique.mockResolvedValue(mockTag as any);

      const result = await service.findOne('tag-1');

      expect(result).toEqual(mockTag);
    });

    it('should throw NotFoundException if tag not found', async () => {
      prismaService.tag.findUnique.mockResolvedValue(null);

      await expect(service.findOne('tag-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByName', () => {
    it('should return a tag by name', async () => {
      prismaService.tag.findUnique.mockResolvedValue(mockTag as any);

      const result = await service.findByName('Technology');

      expect(prismaService.tag.findUnique).toHaveBeenCalledWith({
        where: { name: 'Technology' },
        include: { contents: true },
      });
      expect(result).toEqual(mockTag);
    });
  });

  describe('update', () => {
    const updateInput: UpdateTagInput = { name: 'Updated Technology' };

    it('should update a tag', async () => {
      const updatedTag = { ...mockTag, name: 'Updated Technology' };
      prismaService.tag.findUnique.mockResolvedValue(mockTag as any);
      prismaService.tag.update.mockResolvedValue(updatedTag as any);

      const result = await service.update('tag-1', updateInput);

      expect(result).toEqual(updatedTag);
    });

    it('should throw NotFoundException if tag not found', async () => {
      prismaService.tag.findUnique.mockResolvedValue(null);

      await expect(service.update('tag-1', updateInput)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate name on update', async () => {
      prismaService.tag.findUnique.mockResolvedValue(mockTag as any);
      const error = new Error();
      (error as any).code = 'P2002';
      prismaService.tag.update.mockRejectedValue(error);

      await expect(service.update('tag-1', updateInput)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a tag', async () => {
      prismaService.tag.findUnique.mockResolvedValue(mockTag as any);
      prismaService.tag.delete.mockResolvedValue(mockTag as any);

      const result = await service.remove('tag-1');

      expect(result).toBe(true);
    });

    it('should throw NotFoundException if tag not found', async () => {
      prismaService.tag.findUnique.mockResolvedValue(null);

      await expect(service.remove('tag-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPopularTags', () => {
    it('should return popular tags', async () => {
      const popularTags = [{ ...mockTag, _count: { contents: 10 } }];
      prismaService.tag.findMany.mockResolvedValue(popularTags as any);

      const result = await service.getPopularTags(5);

      expect(prismaService.tag.findMany).toHaveBeenCalledWith({
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
        take: 5,
      });
      expect(result).toEqual(popularTags);
    });
  });
});
