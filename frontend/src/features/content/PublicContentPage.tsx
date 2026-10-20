import { useQuery } from '@apollo/client/react'
import { Link, useParams } from 'react-router'
import { PublicContentDocument } from '../../gql/graphql'
import { externalUrl } from '../../shared/external-url'
import PublicMedia from './PublicMedia'

function StatusMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <p className="mb-4 text-xs font-bold tracking-[0.22em] text-hub-accent uppercase">
        Content Hub
      </p>
      <h1 className="font-hub-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-xl text-lg text-hub-muted">{message}</p>
      <Link
        to="/"
        className="mt-8 inline-block font-semibold text-hub-accent underline underline-offset-4"
      >
        Back to home
      </Link>
    </div>
  )
}

export default function PublicContentPage() {
  const { id } = useParams<'id'>()
  const { data, loading, error } = useQuery(PublicContentDocument, {
    variables: { id: id ?? '' },
    skip: !id,
    fetchPolicy: 'network-only',
  })

  if (loading)
    return (
      <div
        className="mx-auto max-w-6xl px-5 py-24 text-hub-muted"
        role="status"
      >
        Loading story…
      </div>
    )
  if (error)
    return (
      <StatusMessage
        title="Unable to load content"
        message="Please try again in a moment."
      />
    )

  const content = data?.content
  if (!content || content.status !== 'PUBLISHED') {
    return (
      <StatusMessage
        title="Content unavailable"
        message="This story is not available at this address."
      />
    )
  }

  const date = content.publishedAt
    ? new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(content.publishedAt))
    : null
  const sourceUrl = externalUrl(content.source?.url)
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
            <span
              className="flex size-11 items-center justify-center rounded-full bg-hub-lilac font-hub-display text-lg font-semibold text-hub-ink"
              aria-hidden="true"
            >
              {content.author.username.charAt(0).toUpperCase()}
            </span>
            <div>
              <Link
                to={`/?authorId=${encodeURIComponent(content.author.id)}`}
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
              <p className="text-hub-muted">
                No text is available for this story.
              </p>
            )}
          </div>

        </div>

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
      </div>
    </article>
  )
}
