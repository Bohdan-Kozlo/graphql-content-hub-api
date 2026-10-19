import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { Link, useSearchParams } from 'react-router'
import {
  DiscoveryFiltersDocument,
  PublicCatalogDocument,
} from '../../gql/graphql'
import type {
  DiscoveryFiltersQuery,
  PublicCatalogQuery,
} from '../../gql/graphql'
import type { ContentType } from '../../gql/graphql'
import { externalUrl } from '../../shared/external-url'

const PAGE_SIZE = 12

const typeNames = {
  ARTICLE: 'Article',
  VIDEO: 'Video',
  PODCAST: 'Podcast',
  NEWS: 'News',
} as const

type CatalogItem = PublicCatalogQuery['publishedContents']['items'][number]
type Category = DiscoveryFiltersQuery['categories'][number]

function categoryOptions(categories: Category[]) {
  const byParent = new Map<string | null, Category[]>()
  const ids = new Set(categories.map((item) => item.id))
  for (const item of categories) {
    const parentId =
      item.parent && ids.has(item.parent.id) ? item.parent.id : null
    const siblings = byParent.get(parentId) ?? []
    siblings.push(item)
    byParent.set(parentId, siblings)
  }
  const options: { id: string; label: string }[] = []
  const visited = new Set<string>()
  function addChildren(parentId: string | null, depth: number) {
    for (const item of (byParent.get(parentId) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      if (visited.has(item.id)) continue
      visited.add(item.id)
      options.push({ id: item.id, label: `${'↳ '.repeat(depth)}${item.name}` })
      addChildren(item.id, depth + 1)
    }
  }
  addChildren(null, 0)
  return options
}

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
            featured ? 'h-64 sm:h-80' : shelf ? 'h-28 sm:h-32' : 'h-32 sm:h-44'
          }
        >
          <StoryArtwork item={item} />
        </div>
        <div className={featured ? 'mt-6' : 'min-w-0'}>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-hub-muted">
            {item.category && <span>{item.category.name}</span>}
            {date && (
              <time dateTime={item.publishedAt ?? undefined}>{date}</time>
            )}
          </div>
          <h3
            className={`mt-2 font-hub-display leading-tight font-semibold tracking-tight group-hover:text-hub-accent ${
              featured
                ? 'text-3xl sm:text-4xl'
                : shelf
                  ? 'text-xl'
                  : 'text-2xl sm:text-3xl'
            }`}
          >
            {item.title}
          </h3>
          {!shelf && (
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-hub-muted sm:text-base">
              {item.description}
            </p>
          )}
          <p className="mt-3 text-sm font-semibold text-hub-ink">
            {item.author.username}
          </p>
        </div>
      </Link>
    </article>
  )
}

export default function PublicCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search')?.trim() ?? ''
  const rawType = searchParams.get('type')
  const type: ContentType | null =
    rawType && rawType in typeNames ? (rawType as ContentType) : null
  const categoryId = searchParams.get('categoryId') || null
  const tagId = searchParams.get('tagId') || null
  const authorId = searchParams.get('authorId') || null
  const active = Boolean(search || type || categoryId || tagId || authorId)
  const [draft, setDraft] = useState({ search, value: search })
  const searchDraft = draft.search === search ? draft.value : search
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)
  const { data: filters } = useQuery(DiscoveryFiltersDocument)
  const categories = filters?.categories ?? []
  const tags = filters?.tags ?? []
  const categoryName =
    categories.find((item) => item.id === categoryId)?.name ?? categoryId
  const tagName = tags.find((item) => item.id === tagId)?.name ?? tagId
  const filtersVariables = {
    search: search || null,
    type,
    categoryId,
    tagId,
    authorId,
  }
  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    setSearchParams(next)
    setLoadMoreFailed(false)
  }
  const { data, loading, error, fetchMore, refetch } = useQuery(
    PublicCatalogDocument,
    {
      variables: {
        first: PAGE_SIZE,
        after: null,
        ...filtersVariables,
      },
      fetchPolicy: 'network-only',
    },
  )
  const catalog = data?.publishedContents
  const visibleItems =
    catalog?.items.filter((item) => item.status === 'PUBLISHED') ?? []
  const featured = visibleItems[0]
  const shelf = visibleItems.slice(1, 3)
  const discoveries = visibleItems.slice(3)
  const authorName =
    visibleItems.find((item) => item.author.id === authorId)?.author.username ??
    'selected author'

  async function loadMore() {
    if (loadingMore || !catalog?.hasMore || !catalog.endCursor) return
    setLoadingMore(true)
    setLoadMoreFailed(false)
    try {
      await fetchMore({
        variables: {
          first: PAGE_SIZE,
          after: catalog.endCursor,
          ...filtersVariables,
        },
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
        <div className="mb-10 rounded-2xl border border-hub-line bg-hub-surface p-5 sm:p-7">
          <form
            role="search"
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              setFilter('search', searchDraft.trim())
            }}
          >
            <label htmlFor="catalog-search" className="sr-only">
              Search stories
            </label>
            <input
              id="catalog-search"
              type="search"
              value={searchDraft}
              onChange={(event) =>
                setDraft({ search, value: event.target.value })
              }
              placeholder="Search stories"
              className="min-w-0 flex-1 rounded-lg border border-hub-line bg-hub-page px-4 py-3 text-hub-ink"
            />
            <button
              type="submit"
              className="rounded-lg bg-hub-accent px-6 py-3 font-semibold text-hub-page"
            >
              Search
            </button>
          </form>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Content type
              <select
                aria-label="Content type"
                value={type ?? ''}
                onChange={(event) => setFilter('type', event.target.value)}
                className="rounded-lg border border-hub-line bg-hub-page px-3 py-3 font-normal"
              >
                <option value="">All types</option>
                {Object.entries(typeNames).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Category
              <select
                aria-label="Category"
                value={categoryId ?? ''}
                onChange={(event) =>
                  setFilter('categoryId', event.target.value)
                }
                className="rounded-lg border border-hub-line bg-hub-page px-3 py-3 font-normal"
              >
                <option value="">All categories</option>
                {categoryOptions(categories).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Tag
              <select
                aria-label="Tag"
                value={tagId ?? ''}
                onChange={(event) => setFilter('tagId', event.target.value)}
                className="rounded-lg border border-hub-line bg-hub-page px-3 py-3 font-normal"
              >
                <option value="">All tags</option>
                {tags.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {active && (
            <div
              className="mt-5 flex flex-wrap items-center gap-2 text-sm"
              aria-label="Active filters"
            >
              {search && (
                <span className="rounded-full border border-hub-line px-3 py-1">
                  Search: {search}
                </span>
              )}
              {type && (
                <span className="rounded-full border border-hub-line px-3 py-1">
                  Type: {typeNames[type]}
                </span>
              )}
              {categoryId && (
                <span className="rounded-full border border-hub-line px-3 py-1">
                  Category: {categoryName}
                </span>
              )}
              {tagId && (
                <span className="rounded-full border border-hub-line px-3 py-1">
                  Tag: {tagName}
                </span>
              )}
              {authorId && (
                <span className="rounded-full border border-hub-line px-3 py-1">
                  Author: {authorName}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchParams({})
                  setLoadMoreFailed(false)
                }}
                className="font-semibold text-hub-accent underline underline-offset-4"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
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
        ) : catalog && visibleItems.length === 0 ? (
          <p className="py-16 text-hub-muted">
            {active
              ? 'No stories match these filters.'
              : 'No stories published yet.'}
          </p>
        ) : (
          <>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,1fr)] lg:gap-12">
              {featured && <StoryCard item={featured} variant="featured" />}
              {shelf.length > 0 && (
                <div className="border-t border-hub-line pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                  <h3 className="mb-6 font-hub-display text-lg font-semibold">
                    More to explore
                  </h3>
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
