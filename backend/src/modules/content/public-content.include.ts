import { Prisma } from '../../../prisma/generated/client';

export const publicAuthorSelect = {
  id: true,
  username: true,
  bio: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export const publicContentInclude = {
  author: { select: publicAuthorSelect },
  category: true,
  source: true,
  tags: true,
} satisfies Prisma.ContentInclude;
