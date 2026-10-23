import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { PublicCatalogDocument } from '@/shared/api/gql/graphql'
import type { PublicCatalogQueryVariables } from '@/shared/api/gql/graphql'

const PAGE_SIZE = 12
type Filters = Omit<PublicCatalogQueryVariables, 'first' | 'after'>

export function usePublishedContents(filters: Filters, skip = false) {
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)
  const query = useQuery(PublicCatalogDocument, {
    variables: { first: PAGE_SIZE, after: null, ...filters },
    skip,
    fetchPolicy: 'network-only',
  })
  const catalog = query.data?.publishedContents
  // The API enforces publication status. This also keeps malformed data out of the UI.
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
