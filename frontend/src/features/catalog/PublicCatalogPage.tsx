import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { Link } from 'react-router'
import { PublicCatalogDocument } from '../../gql/graphql'
import type { PublicCatalogQuery } from '../../gql/graphql'
import { externalUrl } from '../../shared/external-url'

const PAGE_SIZE = 12

const typeNames = {
  ARTICLE: 'Article',
  VIDEO: 'Video',
  PODCAST: 'Podcast',
  NEWS: 'News',
} as const

type CatalogItem = PublicCatalogQuery['publishedContents']['items'][number]

function publishedDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function StoryArtwork({ item }: { item: CatalogItem }) {
  const imageUrl = externalUrl(item.thumbnail)
  return (
    <div className="relative h-full overflow-hidden rounded-xl bg-hub-lilac">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-12 -bottom-24 size-64 rounded-full bg-hub-peach opacity-80" />
          <div className="absolute -top-20 -left-16 size-64 rounded-full border-[38px] border-hub-accent opacity-75" />
        </div>
      )}
      <span className="absolute bottom-3 left-3 rounded-full bg-hub-page px-3 py-1 text-xs font-bold tracking-wide text-hub-ink">
        {typeNames[item.type]}
      </span>
    </div>
  )
}

function StoryCard({
  item,
  variant,
}: {
  item: CatalogItem
  variant: 'featured' | 'shelf' | 'list'
}) {
  const date = publishedDate(item.publishedAt)
  const featured = variant === 'featured'
  const shelf = variant === 'shelf'

  return (
    <article className="min-w-0">
      <Link
        to={`/content/${item.id}`}
        className={`group rounded-xl focus-visible:rounded-xl ${
          featured
            ? 'block'
            : 'grid grid-cols-[minmax(100px,35%)_minmax(0,1fr)] items-start gap-4 sm:gap-6'
        }`}
        aria-label={`Read ${item.title}`}
      >
        <div
          className={
            featured
              ? 'h-64 sm:h-80'
              : shelf
                ? 'h-28 sm:h-32'
                : 'h-32 sm:h-44'
          }
        >
          <StoryArtwork item={item} />
        </div>
        <div className={featured ? 'mt-6' : 'min-w-0'}>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-hub-muted">
            {item.category && <span>{item.category.name}</span>}
            {date && <time dateTime={item.publishedAt ?? undefined}>{date}</time>}
          </div>
          <h3
            className={`mt-2 font-hub-display leading-tight font-semibold tracking-tight group-hover:text-hub-accent ${
              featured ? 'text-3xl sm:text-4xl' : shelf ? 'text-xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {item.title}
          </h3>
          {!shelf && (
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-hub-muted sm:text-base">
              {item.description}
            </p>
          )}
          <p className="mt-3 text-sm font-semibold text-hub-ink">{item.author.username}</p>
        </div>
      </Link>
    </article>
  )
}

export default function PublicCatalogPage() {
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)
  const { data, loading, error, fetchMore, refetch } = useQuery(
    PublicCatalogDocument,
    {
      variables: { first: PAGE_SIZE, after: null },
      fetchPolicy: 'network-only',
    },
  )
  const catalog = data?.publishedContents
  const featured = catalog?.items[0]
  const shelf = catalog?.items.slice(1, 3) ?? []
  const discoveries = catalog?.items.slice(3) ?? []

  async function loadMore() {
    if (loadingMore || !catalog?.hasMore || !catalog.endCursor) return
    setLoadingMore(true)
    setLoadMoreFailed(false)
    try {
      await fetchMore({
        variables: { first: PAGE_SIZE, after: catalog.endCursor },
      })
    } catch {
      setLoadMoreFailed(true)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-14 pb-16 sm:px-8 sm:pt-20">
      <div className="max-w-3xl">
        <p className="mb-5 text-xs font-bold tracking-[0.25em] text-hub-accent uppercase">
          The public collection
        </p>
        <h1 className="font-hub-display text-5xl leading-[1.08] font-semibold tracking-tight sm:text-7xl">
          Ideas for curious minds.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-hub-muted">
          Read, watch, and listen to the latest stories from the Content Hub.
        </p>
      </div>

      <section aria-labelledby="catalog-heading" className="mt-16 sm:mt-20">
        <div className="mb-7 flex items-end justify-between gap-5 border-b border-hub-line pb-5">
          <h2
            id="catalog-heading"
            className="font-hub-display text-2xl font-semibold sm:text-3xl"
          >
            Latest stories
          </h2>
          <span className="text-xs font-semibold tracking-[0.18em] text-hub-muted uppercase">
            Newest first
          </span>
        </div>

        {loading && !catalog ? (
          <p className="py-16 text-hub-muted" role="status">
            Loading stories…
          </p>
        ) : error && !catalog ? (
          <div className="py-16">
            <p className="text-hub-muted">Unable to load stories.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 font-semibold text-hub-accent underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : catalog?.items.length === 0 ? (
          <p className="py-16 text-hub-muted">No stories published yet.</p>
        ) : (
          <>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,1fr)] lg:gap-12">
              {featured && <StoryCard item={featured} variant="featured" />}
              {shelf.length > 0 && (
                <div className="border-t border-hub-line pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                  <h3 className="mb-6 font-hub-display text-lg font-semibold">More to explore</h3>
                  <div className="space-y-7">
                    {shelf.map((item) => (
                      <StoryCard key={item.id} item={item} variant="shelf" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {discoveries.length > 0 && (
              <div className="mt-14">
                <h3 className="border-b border-hub-line pb-4 font-hub-display text-2xl font-semibold">
                  Discover more
                </h3>
                <div className="divide-y divide-hub-line">
                  {discoveries.map((item) => (
                    <div key={item.id} className="py-7 first:pt-7">
                      <StoryCard item={item} variant="list" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {catalog?.hasMore && (
              <div className="mt-14 flex flex-col items-center gap-3 border-t border-hub-line pt-9">
                {loadMoreFailed && (
                  <p className="text-sm text-hub-muted" role="alert">
                    Could not load more stories.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="rounded-full bg-hub-accent px-7 py-3 text-sm font-semibold text-hub-page disabled:cursor-wait disabled:opacity-60"
                >
                  {loadingMore
                    ? 'Loading more…'
                    : loadMoreFailed
                      ? 'Try again'
                      : 'Load more'}
                </button>
              </div>
            )}
            {!catalog?.hasMore && (
              <p className="mt-14 border-t border-hub-line pt-8 text-center text-sm text-hub-muted">
                You’re all caught up.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  )
}
