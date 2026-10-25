import { BadRequestException } from '@nestjs/common';
import { ContentType } from '../../../prisma/generated/client';
import { CreateContentInput } from './dto/create-content.input';

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function validateMediaDraft(data: CreateContentInput) {
  if (data.type !== ContentType.VIDEO && data.type !== ContentType.PODCAST) return;
  if (!data.categoryId) throw new BadRequestException('Content category is required');
  if (!data.mediaUrl || !isHttpUrl(data.mediaUrl)) throw new BadRequestException('Valid media URL is required');
  if (data.thumbnail && !isHttpUrl(data.thumbnail)) throw new BadRequestException('Thumbnail must be an HTTP(S) URL');
  if (data.body != null || data.readTime != null)
    throw new BadRequestException('Media content cannot have article fields');
  if (data.duration != null && data.duration < 0) throw new BadRequestException('Duration must not be negative');
}
