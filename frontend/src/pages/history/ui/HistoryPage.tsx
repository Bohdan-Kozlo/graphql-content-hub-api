import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { Link } from 'react-router'
import { ViewCount } from '@/entities/content'
import { ViewHistoryDocument } from '@/shared/api/gql/graphql'

const PAGE_SIZE = 20

export default function HistoryPage() {
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)
  const { data, loading, error, refetch, fetchMore } = useQuery(ViewHistoryDocument, {
    variables: { first: PAGE_SIZE, after: null },
    fetchPolicy: 'network-only',
  })
  const items = data?.myViewHistory.items ?? []

  async function loadMore() {
    const page = data?.myViewHistory
    if (!page?.hasMore || !page.endCursor || loadingMore) return
    setLoadingMore(true)
    setLoadMoreFailed(false)
    try {
      await fetchMore({
        variables: { first: PAGE_SIZE, after: page.endCursor },
        updateQuery(previous, { fetchMoreResult }) {
          return {
            myViewHistory: {
              ...fetchMoreResult.myViewHistory,
              items: [
                ...previous.myViewHistory.items,
                ...fetchMoreResult.myViewHistory.items,
              ],
            },
          }
        },
      })
    } catch {
      setLoadMoreFailed(true)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading && !data)
    return (
      <p role="status" className="mx-auto max-w-6xl px-5 py-24 text-hub-muted">
        Loading reading history…
      </p>
    )
  if (error)
    return (
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <h1 className="font-hub-display text-4xl font-semibold tracking-tight">
          Unable to load history
        </h1>
        <p className="mt-5 text-hub-muted">Please try again in a moment.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-6 font-semibold text-hub-accent underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    )

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-xs font-bold tracking-[0.22em] text-hub-accent uppercase">
        Your reading activity
      </p>
      <h1 className="mt-4 font-hub-display text-5xl font-semibold tracking-tight sm:text-6xl">
        Reading history
      </h1>
      {items.length === 0 ? (
        <div className="mt-12 border-t border-hub-line pt-10">
          <p className="text-lg text-hub-muted">You have not opened any stories yet.</p>
          <Link
            to="/"
            className="mt-5 inline-block font-semibold text-hub-accent underline underline-offset-4"
          >
            Browse the catalog
          </Link>
        </div>
      ) : (
        <div className="mt-12 divide-y divide-hub-line border-t border-hub-line">
          {items.map((item) => (
            <article key={item.id} className="py-8">
              <p className="text-sm font-semibold text-hub-muted">
                {item.author.username}
              </p>
              <h2 className="mt-2 font-hub-display text-2xl font-semibold tracking-tight sm:text-3xl">
                <Link to={`/content/${item.id}`} className="hover:text-hub-accent">
                  {item.title}
                </Link>
              </h2>
              <p className="mt-3 max-w-2xl text-hub-muted">{item.description}</p>
              <p className="mt-3 text-sm text-hub-muted">
                <ViewCount count={item.viewCount} />
              </p>
            </article>
          ))}
        </div>
      )}
      {data?.myViewHistory.hasMore && (
        <div className="mt-10 text-center">
          {loadMoreFailed && (
            <p role="alert" className="mb-3 text-sm text-red-600">
              Could not load more history.
            </p>
          )}
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded-full bg-hub-accent px-6 py-3 text-sm font-semibold text-hub-page disabled:cursor-wait disabled:opacity-60"
          >
            {loadingMore ? 'Loading more…' : loadMoreFailed ? 'Try again' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
