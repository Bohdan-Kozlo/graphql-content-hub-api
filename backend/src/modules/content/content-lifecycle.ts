import { BadRequestException, Injectable } from '@nestjs/common';
import { Content, ContentStatus, ContentType } from '../../../prisma/generated/client';
import { validateArticleBody, validatePublishableArticleBody } from './article-body';
import { CreateContentInput } from './dto/create-content.input';
import { UpdateContentInput } from './dto/update-content.input';
import { validateMediaDraft } from './media-draft';

@Injectable()
export class ContentLifecycle {
  validateNewContent(data: CreateContentInput) {
    if (this.isArticle(data.type)) {
      this.requireCategory(data.categoryId);
      validateArticleBody(data.body);
    } else {
      validateMediaDraft(data);
    }
  }

  validateContentUpdate(current: Content, changes: UpdateContentInput) {
    const type = changes.type ?? current.type;
    const articleBodyChanged = changes.body !== undefined;
    if (
      (changes.type !== undefined && this.isArticle(changes.type)) ||
      (this.isArticle(current.type) && articleBodyChanged)
    ) {
      validateArticleBody(changes.body ?? current.body ?? undefined);
    }

    const mediaFieldsChanged =
      changes.type !== undefined ||
      changes.mediaUrl !== undefined ||
      changes.thumbnail !== undefined ||
      changes.duration !== undefined;
    if (!this.isArticle(type) && (current.status === ContentStatus.DRAFT || mediaFieldsChanged)) {
      validateMediaDraft({
        title: changes.title ?? current.title,
        description: changes.description ?? current.description,
        type,
        categoryId: changes.categoryId === undefined ? (current.categoryId ?? undefined) : changes.categoryId,
        mediaUrl: changes.mediaUrl === undefined ? (current.mediaUrl ?? undefined) : changes.mediaUrl,
        thumbnail: changes.thumbnail === undefined ? (current.thumbnail ?? undefined) : changes.thumbnail,
        duration: changes.duration === undefined ? (current.duration ?? undefined) : changes.duration,
        body: changes.body === undefined ? (current.body ?? undefined) : changes.body,
        readTime: changes.readTime === undefined ? (current.readTime ?? undefined) : changes.readTime,
      });
    }
    if (this.isArticle(type)) this.requireCategory(changes.categoryId ?? current.categoryId);
  }

  validateDraftForPublication(draft: Content) {
    if (!draft.title.trim() || !draft.description.trim() || !draft.categoryId) {
      throw new BadRequestException('Complete the title, description, and category before publishing');
    }
    if (this.isArticle(draft.type)) {
      validatePublishableArticleBody(draft.body ?? undefined);
    } else {
      validateMediaDraft({
        title: draft.title,
        description: draft.description,
        type: draft.type,
        categoryId: draft.categoryId,
        mediaUrl: draft.mediaUrl ?? undefined,
        thumbnail: draft.thumbnail ?? undefined,
        duration: draft.duration ?? undefined,
        body: draft.body ?? undefined,
        readTime: draft.readTime ?? undefined,
      });
    }
  }

  private isArticle(type: ContentType) {
    return type === ContentType.ARTICLE || type === ContentType.NEWS;
  }

  private requireCategory(categoryId: string | null | undefined) {
    if (!categoryId) throw new BadRequestException('Content category is required');
  }
}
