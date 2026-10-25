import { Content, ContentStatus, ContentType } from '../../../prisma/generated/client';
import { ContentLifecycle } from './content-lifecycle';

const body = JSON.stringify({
  version: 1,
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ready to publish' }] }],
});

function content(overrides: Partial<Content> = {}): Content {
  return {
    id: 'draft-1',
    title: 'Story',
    description: 'Description',
    type: ContentType.ARTICLE,
    status: ContentStatus.DRAFT,
    body,
    categoryId: 'category-1',
    mediaUrl: null,
    thumbnail: null,
    duration: null,
    readTime: null,
    sourceId: null,
    authorId: 'editor-1',
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Content lifecycle policy', () => {
  const lifecycle = new ContentLifecycle();
  it('allows an empty article Draft but requires text before publication', () => {
    const emptyBody = JSON.stringify({ version: 1, type: 'doc', content: [{ type: 'paragraph' }] });
    const draft = content({ body: emptyBody });
    expect(() =>
      lifecycle.validateNewContent({
        title: draft.title,
        description: draft.description,
        type: draft.type,
        body: emptyBody,
        categoryId: draft.categoryId!,
      }),
    ).not.toThrow();
    expect(() => lifecycle.validateDraftForPublication(draft)).toThrow('Article text is required before publishing');
  });

  it('validates the effective Draft when changing media metadata', () => {
    const draft = content({ type: ContentType.VIDEO, body: null, mediaUrl: 'https://example.org/video' });
    expect(() => lifecycle.validateContentUpdate(draft, { thumbnail: 'javascript:alert(1)' })).toThrow(
      'Thumbnail must be an HTTP(S) URL',
    );
    expect(() => lifecycle.validateContentUpdate(draft, { thumbnail: 'https://example.org/cover' })).not.toThrow();
  });

  it('keeps a legacy published media title editable without requiring missing media fields', () => {
    const published = content({ type: ContentType.VIDEO, status: ContentStatus.PUBLISHED, body: null, mediaUrl: null });
    expect(() => lifecycle.validateContentUpdate(published, { title: 'Corrected title' })).not.toThrow();
    expect(() => lifecycle.validateContentUpdate(published, { mediaUrl: 'javascript:alert(1)' })).toThrow();
  });

  it('requires a category when changing a media Draft into an article', () => {
    const draft = content({
      type: ContentType.VIDEO,
      body: null,
      categoryId: null,
      mediaUrl: 'https://example.org/video',
    });
    expect(() => lifecycle.validateContentUpdate(draft, { type: ContentType.ARTICLE, body })).toThrow(
      'Content category is required',
    );
  });
});
