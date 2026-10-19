import { useQuery } from '@apollo/client/react'
import { Link, useParams } from 'react-router'
import { PublicContentDocument } from '../../gql/graphql'

function externalUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : null
  } catch {
    return null
  }
}

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
  const mediaUrl = externalUrl(content.mediaUrl)
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
              <p className="font-semibold">{content.author.username}</p>
              <p className="text-sm text-hub-muted">Author</p>
            </div>
          </div>

          <div
            className="relative mt-10 h-56 overflow-hidden rounded-2xl bg-hub-lilac sm:h-80"
            role="img"
            aria-label="Abstract story illustration"
          >
            <div className="absolute -top-20 right-[5%] size-64 rounded-full bg-hub-peach opacity-90 sm:size-96" />
            <div className="absolute -bottom-36 left-[8%] h-72 w-[78%] rotate-[-17deg] rounded-[50%] bg-hub-accent opacity-70 sm:h-96" />
            <div className="absolute right-[12%] bottom-[-25%] size-48 rounded-full border-[26px] border-hub-page opacity-70 sm:size-64" />
          </div>

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

          {mediaUrl && (
            <a
              href={mediaUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-9 inline-block font-semibold text-hub-accent underline underline-offset-4"
            >
              Open original media
            </a>
          )}
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
              <p className="mt-1 font-semibold">{content.category.name}</p>
            </div>
          )}
          {content.tags.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-hub-muted">Topics</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {content.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-hub-line px-3 py-1 text-sm"
                  >
                    {tag.name}
                  </span>
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
