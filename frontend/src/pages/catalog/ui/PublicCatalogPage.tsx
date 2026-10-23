import { useCatalogFilters } from '../model/catalog-filters'
import { useCatalogData } from '../model/use-catalog-data'
import { CatalogFilters } from './CatalogFilters'
import { CatalogResults } from './CatalogResults'

export default function PublicCatalogPage() {
  const filters = useCatalogFilters()
  const catalog = useCatalogData(filters.values)
  const authorName =
    catalog.visibleItems.find((item) => item.author.id === filters.values.authorId)
      ?.author.username ?? 'selected author'

  function changeFilter(name: keyof typeof filters.values, value: string) {
    filters.setFilter(name, value)
    catalog.resetLoadMoreError()
  }

  function clearFilters() {
    filters.clearFilters()
    catalog.resetLoadMoreError()
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
        <CatalogFilters
          values={filters.values}
          active={filters.active}
          searchDraft={filters.searchDraft}
          categories={catalog.categories}
          tags={catalog.tags}
          authorName={authorName}
          onSearchDraftChange={filters.setSearchDraft}
          onFilterChange={changeFilter}
          onClear={clearFilters}
        />

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

        <CatalogResults
          items={catalog.visibleItems}
          loading={catalog.loading}
          failed={Boolean(catalog.error)}
          hasCatalog={Boolean(catalog.catalog)}
          hasMore={catalog.catalog?.hasMore ?? false}
          activeFilters={filters.active}
          loadingMore={catalog.loadingMore}
          loadMoreFailed={catalog.loadMoreFailed}
          onRetry={() => void catalog.refetch()}
          onLoadMore={() => void catalog.loadMore()}
        />
      </section>
    </div>
  )
}
