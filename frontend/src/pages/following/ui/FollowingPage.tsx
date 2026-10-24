import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { Link } from 'react-router'
import { ViewCount } from '@/entities/content'
import { TopicFollowButton } from '@/features/topic-follow'
import { FollowingFeedDocument, FollowingOptionsDocument } from '@/shared/api/gql/graphql'

const PAGE_SIZE = 12

export default function FollowingPage() {
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)
  const { data, loading, error, refetch, fetchMore } = useQuery(FollowingFeedDocument, {
    variables: { first: PAGE_SIZE, after: null },
    fetchPolicy: 'network-only',
  })
  const feed = data?.followingFeed
  const options = useQuery(FollowingOptionsDocument)

  async function loadMore() {
    if (!feed?.hasMore || !feed.endCursor || loadingMore) return
    setLoadingMore(true)
    setLoadMoreFailed(false)
    try {
      await fetchMore({
        variables: { first: PAGE_SIZE, after: feed.endCursor },
        updateQuery(previous, { fetchMoreResult }) {
          const seen = new Set(previous.followingFeed.items.map((item) => item.id))
          return {
            ...previous,
            followingFeed: {
              ...fetchMoreResult.followingFeed,
              items: [
                ...previous.followingFeed.items,
                ...fetchMoreResult.followingFeed.items.filter(
                  (item) => !seen.has(item.id),
                ),
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
      <p role="status" className="mx-auto max-w-4xl px-5 py-24">
        Loading Following…
      </p>
    )
  if (error && !data)
    return (
      <div className="mx-auto max-w-4xl px-5 py-24">
        <h1 className="font-hub-display text-4xl">Unable to load Following</h1>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-5 font-semibold text-hub-accent underline"
        >
          Try again
        </button>
      </div>
    )

  const items = feed?.items.filter((item) => item.status === 'PUBLISHED') ?? []
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-xs font-bold tracking-[0.22em] text-hub-accent uppercase">
        Your interests
      </p>
      <h1 className="mt-4 font-hub-display text-5xl font-semibold tracking-tight sm:text-6xl">
        Following
      </h1>
      <section
        aria-label="Browse interests"
        className="mt-10 rounded-2xl border border-hub-line bg-hub-surface p-5 sm:p-7"
      >
        <h2 className="font-hub-display text-2xl font-semibold">Browse interests</h2>
        {options.loading && !options.data && (
          <p role="status" className="mt-4 text-hub-muted">
            Loading categories and sources…
          </p>
        )}
        {options.error && (
          <div className="mt-4">
            <p role="alert">Unable to load categories and sources.</p>
            <button
              type="button"
              onClick={() => void options.refetch()}
              className="font-semibold text-hub-accent underline"
            >
              Try again
            </button>
          </div>
        )}
        {options.data && (
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold">Categories</h3>
              <ul className="space-y-3">
                {options.data.categories.map((category) => (
                  <li
                    key={category.id}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <span>{category.name}</span>
                    <TopicFollowButton
                      kind="category"
                      id={category.id}
                      name={category.name}
                      onChange={() => void refetch()}
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">Sources</h3>
              <ul className="space-y-3">
                {options.data.sources.map((source) => (
                  <li
                    key={source.id}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <span>{source.name}</span>
                    <TopicFollowButton
                      kind="source"
                      id={source.id}
                      name={source.name}
                      onChange={() => void refetch()}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
      {error && data && (
        <div className="mt-8" role="alert">
          <p>Could not refresh Following. Showing the last loaded stories.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 font-semibold text-hub-accent underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}
      {data &&
      data.myFollowedAuthors.length +
        (data.myFollowedCategories?.length ?? 0) +
        (data.myFollowedSources?.length ?? 0) ===
        0 ? (
        <div className="mt-12 border-t border-hub-line pt-10">
          <p className="text-lg text-hub-muted">
            You are not following anyone or anything yet.
          </p>
          <Link
            to="/"
            className="mt-5 inline-block font-semibold text-hub-accent underline underline-offset-4"
          >
            Explore stories
          </Link>
        </div>
      ) : items.length === 0 ? (
        <p className="mt-12 border-t border-hub-line pt-10 text-hub-muted">
          No published stories from your follows yet.
        </p>
      ) : (
        <div className="mt-12 divide-y divide-hub-line border-t border-hub-line">
          {items.map((item) => (
            <article key={item.id} className="py-8">
              <Link
                to={`/users/${item.author.id}`}
                className="text-sm font-semibold text-hub-accent underline underline-offset-4"
              >
                {item.author.username}
              </Link>
              <h2 className="mt-2 font-hub-display text-2xl font-semibold">
                <Link to={`/content/${item.id}`} className="hover:text-hub-accent">
                  {item.title}
                </Link>
              </h2>
              <p className="mt-3 text-hub-muted">{item.description}</p>
              <p className="mt-3 text-sm text-hub-muted">
                <ViewCount count={item.viewCount} />
              </p>
            </article>
          ))}
        </div>
      )}
      {feed?.hasMore && (
        <div className="mt-10 text-center">
          {loadMoreFailed && (
            <p role="alert" className="mb-3">
              Could not load more stories.
            </p>
          )}
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded-full bg-hub-accent px-6 py-3 font-semibold text-hub-page disabled:opacity-60"
          >
            {loadingMore ? 'Loading more…' : loadMoreFailed ? 'Try again' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
