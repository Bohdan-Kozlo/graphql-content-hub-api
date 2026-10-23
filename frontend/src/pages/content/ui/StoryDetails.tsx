import { Link } from 'react-router'
import type { PublicContentQuery } from '@/shared/api/gql/graphql'
import { externalUrl } from '@/shared/lib/url'

type Story = NonNullable<PublicContentQuery['content']>

export function StoryDetails({ content }: { content: Story }) {
  const sourceUrl = externalUrl(content.source?.url)

  return (
    <aside
      className="h-fit border-t border-hub-line pt-7 lg:mt-44"
      aria-label="Story details"
    >
      <p className="mb-6 text-xs font-bold tracking-[0.2em] text-hub-muted uppercase">
        About this story
      </p>
      {content.category && (
        <div className="mb-6">
          <p className="text-sm text-hub-muted">Category</p>
          <Link
            to={`/?categoryId=${encodeURIComponent(content.category.id)}`}
            className="mt-1 inline-block font-semibold text-hub-accent underline underline-offset-4"
          >
            {content.category.name}
          </Link>
        </div>
      )}
      {content.tags.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-hub-muted">Topics</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/?tagId=${encodeURIComponent(tag.id)}`}
                className="rounded-full border border-hub-line px-3 py-1 text-sm"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {content.source && (
        <div>
          <p className="text-sm text-hub-muted">Source</p>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 inline-block font-semibold text-hub-accent underline underline-offset-4"
            >
              {content.source.name}
            </a>
          ) : (
            <p className="mt-1 font-semibold">{content.source.name}</p>
          )}
        </div>
      )}
    </aside>
  )
}
