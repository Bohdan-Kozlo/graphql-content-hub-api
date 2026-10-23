import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { DiscoveryFiltersDocument, PublicCatalogDocument } from '@/shared/api/gql/graphql'
import type { CatalogFilterValues } from './catalog-filters'

const PAGE_SIZE = 12

export function useCatalogData(filters: CatalogFilterValues) {
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)
  const { data: discovery } = useQuery(DiscoveryFiltersDocument)
  const query = useQuery(PublicCatalogDocument, {
    variables: { first: PAGE_SIZE, after: null, ...filters },
    fetchPolicy: 'network-only',
  })

  const catalog = query.data?.publishedContents
  // The API enforces publication status. This check also keeps malformed data out of the UI.
  const visibleItems = catalog?.items.filter((item) => item.status === 'PUBLISHED') ?? []

  async function loadMore() {
    if (loadingMore || !catalog?.hasMore || !catalog.endCursor) return
    setLoadingMore(true)
    setLoadMoreFailed(false)
    try {
      await query.fetchMore({
        variables: { first: PAGE_SIZE, after: catalog.endCursor, ...filters },
      })
    } catch {
      setLoadMoreFailed(true)
    } finally {
      setLoadingMore(false)
    }
  }

  return {
    categories: discovery?.categories ?? [],
    tags: discovery?.tags ?? [],
    catalog,
    visibleItems,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
    loadingMore,
    loadMoreFailed,
    loadMore,
    resetLoadMoreError: () => setLoadMoreFailed(false),
  }
}
