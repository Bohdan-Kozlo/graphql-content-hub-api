import type { DiscoveryFiltersQuery } from '@/shared/api/gql/graphql'
import { contentTypeNames } from '../model/catalog-filters'
import type { CatalogFilterValues } from '../model/catalog-filters'

type Props = {
  values: CatalogFilterValues
  categories: DiscoveryFiltersQuery['categories']
  tags: DiscoveryFiltersQuery['tags']
  authorName: string
  onClear: () => void
}

export function ActiveFilters({ values, categories, tags, authorName, onClear }: Props) {
  const categoryName = categories.find((item) => item.id === values.categoryId)?.name
  const tagName = tags.find((item) => item.id === values.tagId)?.name

  return (
    <div
      className="mt-5 flex flex-wrap items-center gap-2 text-sm"
      aria-label="Active filters"
    >
      {values.search && (
        <span className="rounded-full border border-hub-line px-3 py-1">
          Search: {values.search}
        </span>
      )}
      {values.type && (
        <span className="rounded-full border border-hub-line px-3 py-1">
          Type: {contentTypeNames[values.type]}
        </span>
      )}
      {values.categoryId && (
        <span className="rounded-full border border-hub-line px-3 py-1">
          Category: {categoryName ?? values.categoryId}
        </span>
      )}
      {values.tagId && (
        <span className="rounded-full border border-hub-line px-3 py-1">
          Tag: {tagName ?? values.tagId}
        </span>
      )}
      {values.authorId && (
        <span className="rounded-full border border-hub-line px-3 py-1">
          Author: {authorName}
        </span>
      )}
      <button
        type="button"
        onClick={onClear}
        className="font-semibold text-hub-accent underline underline-offset-4"
      >
        Clear filters
      </button>
    </div>
  )
}
