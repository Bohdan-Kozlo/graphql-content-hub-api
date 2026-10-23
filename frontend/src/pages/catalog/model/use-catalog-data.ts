import { useQuery } from '@apollo/client/react'
import { usePublishedContents } from '@/entities/content'
import { DiscoveryFiltersDocument } from '@/shared/api/gql/graphql'
import type { CatalogFilterValues } from './catalog-filters'

export function useCatalogData(filters: CatalogFilterValues) {
  const { data: discovery } = useQuery(DiscoveryFiltersDocument)
  const content = usePublishedContents(filters)
  return {
    ...content,
    categories: discovery?.categories ?? [],
    tags: discovery?.tags ?? [],
  }
}
