import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User, Role } from '../../../prisma/generated/client';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'hashedPassword',
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    authVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    bio: null,
    avatarUrl: null,
    role: [Role.USER],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: vi.fn(),
              findMany: vi.fn(),
              findUnique: vi.fn(),
              update: vi.fn(),
              delete: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserInput: CreateUserInput = {
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
      };

      vi.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);

      const result = await service.create(createUserInput);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      vi.spyOn(prismaService.user, 'findMany').mockResolvedValue([mockUser]);
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      const result = await service.findOne('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user not found', async () => {
      vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow('User not found');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserInput: UpdateUserInput = {
        username: 'updateduser',
        email: 'updated@example.com',
        id: mockUser.id,
      };

      const updatedUser = { ...mockUser, ...updateUserInput };

      vi.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await service.update('1', updateUserInput);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('delete', () => {
    it('should delete a user and return true', async () => {
      vi.spyOn(prismaService.user, 'delete').mockResolvedValue(mockUser);
      const result = await service.delete('1');
      expect(result).toBe(true);
    });

    it('should return false if delete fails', async () => {
      vi.spyOn(prismaService.user, 'delete').mockRejectedValue(new Error('Delete failed'));
      const result = await service.delete('1');
      expect(result).toBe(false);
    });
  });
});
