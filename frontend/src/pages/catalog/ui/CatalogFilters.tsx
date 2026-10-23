import type { DiscoveryFiltersQuery } from '@/shared/api/gql/graphql'
import { categoryOptions, contentTypeNames } from '../model/catalog-filters'
import type { CatalogFilterValues } from '../model/catalog-filters'
import { ActiveFilters } from './ActiveFilters'

type Props = {
  values: CatalogFilterValues
  active: boolean
  searchDraft: string
  categories: DiscoveryFiltersQuery['categories']
  tags: DiscoveryFiltersQuery['tags']
  authorName: string
  onSearchDraftChange: (value: string) => void
  onFilterChange: (name: keyof CatalogFilterValues, value: string) => void
  onClear: () => void
}

export function CatalogFilters({
  values,
  active,
  searchDraft,
  categories,
  tags,
  authorName,
  onSearchDraftChange,
  onFilterChange,
  onClear,
}: Props) {
  return (
    <div className="mb-10 rounded-2xl border border-hub-line bg-hub-surface p-5 sm:p-7">
      <form
        role="search"
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          onFilterChange('search', searchDraft.trim())
        }}
      >
        <label htmlFor="catalog-search" className="sr-only">
          Search stories
        </label>
        <input
          id="catalog-search"
          type="search"
          value={searchDraft}
          onChange={(event) => onSearchDraftChange(event.target.value)}
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
            value={values.type ?? ''}
            onChange={(event) => onFilterChange('type', event.target.value)}
            className="rounded-lg border border-hub-line bg-hub-page px-3 py-3 font-normal"
          >
            <option value="">All types</option>
            {Object.entries(contentTypeNames).map(([value, label]) => (
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
            value={values.categoryId ?? ''}
            onChange={(event) => onFilterChange('categoryId', event.target.value)}
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
            value={values.tagId ?? ''}
            onChange={(event) => onFilterChange('tagId', event.target.value)}
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
        <ActiveFilters
          values={values}
          categories={categories}
          tags={tags}
          authorName={authorName}
          onClear={onClear}
        />
      )}
    </div>
  )
}
