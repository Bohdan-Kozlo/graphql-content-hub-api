import { useSyncExternalStore } from 'react'
import { useQuery } from '@apollo/client/react'
import { Link, useParams } from 'react-router'
import { getAccount, subscribeSession } from '@/entities/account'
import { usePublishedContents } from '@/entities/content'
import { PublicProfileDocument } from '@/shared/api/gql/graphql'
import { Avatar } from '@/shared/ui/avatar'

export default function PublicProfilePage() {
  const { id } = useParams<'id'>()
  const account = useSyncExternalStore(subscribeSession, getAccount)
  const profileQuery = useQuery(PublicProfileDocument, {
    variables: { id: id ?? '' },
    skip: !id,
    fetchPolicy: 'network-only',
  })
  const storiesQuery = usePublishedContents(
    { authorId: id ?? '' },
    !id || !profileQuery.data?.publicProfile,
  )
  const profile = profileQuery.data?.publicProfile
  const stories = storiesQuery.catalog

  if (profileQuery.loading)
    return (
      <p role="status" className="mx-auto max-w-6xl px-5 py-24">
        Loading profile…
      </p>
    )
  if (profileQuery.error)
    return (
      <div className="mx-auto max-w-6xl px-5 py-24">
        <p role="alert">Unable to load profile.</p>
        <button
          type="button"
          onClick={() => void profileQuery.refetch()}
          className="mt-4 font-semibold text-hub-accent underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    )
  if (!profile)
    return (
      <h1 className="mx-auto max-w-6xl px-5 py-24 font-hub-display text-4xl">
        Profile not found
      </h1>
    )

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="flex flex-col gap-6 border-b border-hub-line pb-12 sm:flex-row sm:items-center sm:gap-9">
        <Avatar username={profile.username} url={profile.avatarUrl} />
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.22em] text-hub-accent uppercase">
            Public profile
          </p>
          <h1 className="mt-2 break-words font-hub-display text-4xl font-semibold sm:text-5xl">
            {profile.username}
          </h1>
          {profile.bio && (
            <p className="mt-4 max-w-2xl whitespace-pre-wrap text-hub-muted">
              {profile.bio}
            </p>
          )}
          {account?.id === profile.id && (
            <Link
              to="/account"
              className="mt-5 inline-block font-semibold text-hub-accent underline underline-offset-4"
            >
              Edit profile
            </Link>
          )}
        </div>
      </div>
      <section aria-labelledby="profile-stories" className="pt-12">
        <h2 id="profile-stories" className="font-hub-display text-2xl font-semibold">
          Published stories
        </h2>
        {storiesQuery.loading && !stories && (
          <p role="status" className="mt-8 text-hub-muted">
            Loading stories…
          </p>
        )}
        {storiesQuery.error && !stories && (
          <div className="mt-8">
            <p role="alert" className="text-hub-muted">
              Unable to load stories.
            </p>
            <button
              type="button"
              onClick={() => void storiesQuery.refetch()}
              className="mt-4 font-semibold text-hub-accent underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}
        {stories && stories.items.length === 0 && (
          <p className="mt-8 text-hub-muted">No stories published yet.</p>
        )}
        {stories && stories.items.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {storiesQuery.visibleItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-hub-line bg-hub-surface p-6"
              >
                <Link
                  to={`/content/${item.id}`}
                  aria-label={`Read ${item.title}`}
                  className="font-hub-display text-xl font-semibold hover:text-hub-accent"
                >
                  {item.title}
                </Link>
                <p className="mt-2 line-clamp-2 text-sm text-hub-muted">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        )}
        {storiesQuery.loadMoreFailed && (
          <p role="alert" className="mt-6">
            Could not load more stories.
          </p>
        )}
        {stories?.hasMore && (
          <button
            type="button"
            onClick={() => void storiesQuery.loadMore()}
            disabled={storiesQuery.loadingMore}
            className="mt-8 rounded-full bg-hub-accent px-6 py-3 font-semibold text-hub-page disabled:opacity-60"
          >
            {storiesQuery.loadingMore
              ? 'Loading more…'
              : storiesQuery.loadMoreFailed
                ? 'Try again'
                : 'Load more'}
          </button>
        )}
      </section>
    </div>
  )
}
