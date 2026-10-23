import { Link } from 'react-router'
import type { PublicContentQuery } from '@/shared/api/gql/graphql'
import { Avatar } from '@/shared/ui/avatar'
import PublicMedia from './PublicMedia'
import { StoryDetails } from './StoryDetails'

type Story = NonNullable<PublicContentQuery['content']>

export function ContentArticle({ content }: { content: Story }) {
  const date = content.publishedAt
    ? new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(content.publishedAt))
    : null
  const paragraphs =
    content.body
      ?.split(/\n\s*\n|\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean) ?? []

  return (
    <article className="mx-auto max-w-6xl px-5 pt-10 sm:px-8 sm:pt-16">
      <nav aria-label="Breadcrumb" className="mb-9 text-sm text-hub-muted">
        <Link to="/" className="hover:text-hub-accent">
          Home
        </Link>
        <span aria-hidden="true" className="mx-3">
          /
        </span>
        <span>{content.type.toLowerCase()}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-bold tracking-[0.17em] uppercase">
            <span className="rounded-full bg-hub-surface px-4 py-2 text-hub-accent">
              {content.type}
            </span>
            {date && (
              <time
                dateTime={content.publishedAt ?? undefined}
                className="text-hub-muted"
              >
                {date}
              </time>
            )}
          </div>
          <h1 className="max-w-3xl font-hub-display text-4xl leading-[1.08] font-semibold tracking-tight sm:text-6xl">
            {content.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-hub-muted sm:text-xl">
            {content.description}
          </p>

          <div className="mt-9 flex items-center gap-3 border-t border-hub-line pt-6">
            <Avatar
              username={content.author.username}
              url={content.author.avatarUrl}
              size="small"
            />
            <div>
              <Link
                to={`/users/${encodeURIComponent(content.author.id)}`}
                className="font-semibold text-hub-accent underline underline-offset-4"
              >
                {content.author.username}
              </Link>
              <p className="text-sm text-hub-muted">Author</p>
            </div>
          </div>

          <PublicMedia
            type={content.type}
            title={content.title}
            mediaUrl={content.mediaUrl}
            thumbnail={content.thumbnail}
          />

          <div className="mt-12 space-y-6 text-[1.05rem] leading-8 sm:text-lg">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={index} className="whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-hub-muted">No text is available for this story.</p>
            )}
          </div>
        </div>

        <StoryDetails content={content} />
      </div>
    </article>
  )
}
