import { StoryCard } from './StoryCard'
import type { CatalogItem } from './StoryCard'

type Props = {
  items: CatalogItem[]
  loading: boolean
  failed: boolean
  hasCatalog: boolean
  hasMore: boolean
  activeFilters: boolean
  loadingMore: boolean
  loadMoreFailed: boolean
  onRetry: () => void
  onLoadMore: () => void
}

function loadMoreLabel(loading: boolean, failed: boolean) {
  if (loading) return 'Loading more…'
  if (failed) return 'Try again'
  return 'Load more'
}

export function CatalogResults({
  items,
  loading,
  failed,
  hasCatalog,
  hasMore,
  activeFilters,
  loadingMore,
  loadMoreFailed,
  onRetry,
  onLoadMore,
}: Props) {
  if (loading && !hasCatalog) {
    return (
      <p className="py-16 text-hub-muted" role="status">
        Loading stories…
      </p>
    )
  }

  if (failed && !hasCatalog) {
    return (
      <div className="py-16">
        <p className="text-hub-muted">Unable to load stories.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 font-semibold text-hub-accent underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    )
  }

  if (hasCatalog && items.length === 0) {
    return (
      <p className="py-16 text-hub-muted">
        {activeFilters ? 'No stories match these filters.' : 'No stories published yet.'}
      </p>
    )
  }

  const featured = items[0]
  const shelf = items.slice(1, 3)
  const discoveries = items.slice(3)

  return (
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

      {hasMore ? (
        <div className="mt-14 flex flex-col items-center gap-3 border-t border-hub-line pt-9">
          {loadMoreFailed && (
            <p className="text-sm text-hub-muted" role="alert">
              Could not load more stories.
            </p>
          )}
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-full bg-hub-accent px-7 py-3 text-sm font-semibold text-hub-page disabled:cursor-wait disabled:opacity-60"
          >
            {loadMoreLabel(loadingMore, loadMoreFailed)}
          </button>
        </div>
      ) : (
        <p className="mt-14 border-t border-hub-line pt-8 text-center text-sm text-hub-muted">
          You’re all caught up.
        </p>
      )}
    </>
  )
}
