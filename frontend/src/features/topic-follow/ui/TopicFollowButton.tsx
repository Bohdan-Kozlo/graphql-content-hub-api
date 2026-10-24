import { useState, useSyncExternalStore } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { Link, useLocation } from 'react-router'
import { getAccount, subscribeSession } from '@/entities/account'
import {
  FollowCategoryDocument,
  FollowedTopicsDocument,
  FollowSourceDocument,
  UnfollowCategoryDocument,
  UnfollowSourceDocument,
} from '@/shared/api/gql/graphql'

export function TopicFollowButton({
  kind,
  id,
  name,
  onChange,
}: {
  kind: 'category' | 'source'
  id: string
  name: string
  onChange?: () => void
}) {
  const account = useSyncExternalStore(subscribeSession, getAccount)
  const location = useLocation()
  const [failed, setFailed] = useState(false)
  const followed = useQuery(FollowedTopicsDocument, { skip: !account })
  const [followCategory, followingCategory] = useMutation(FollowCategoryDocument)
  const [unfollowCategory, unfollowingCategory] = useMutation(UnfollowCategoryDocument)
  const [followSource, followingSource] = useMutation(FollowSourceDocument)
  const [unfollowSource, unfollowingSource] = useMutation(UnfollowSourceDocument)

  if (!account)
    return (
      <Link
        to="/login"
        state={{ from: location.pathname }}
        className="text-sm font-semibold text-hub-accent underline underline-offset-4"
      >
        Sign in to follow {kind}
      </Link>
    )
  if (followed.loading && !followed.data)
    return (
      <span role="status" className="text-sm text-hub-muted">
        Loading follow status…
      </span>
    )
  if (followed.error)
    return (
      <button
        type="button"
        onClick={() => void followed.refetch()}
        className="text-sm font-semibold text-hub-accent underline"
      >
        Retry follow status
      </button>
    )

  const isFollowing =
    kind === 'category'
      ? followed.data?.myFollowedCategories?.some((item) => item.id === id)
      : followed.data?.myFollowedSources?.some((item) => item.id === id)
  const busy =
    followingCategory.loading ||
    unfollowingCategory.loading ||
    followingSource.loading ||
    unfollowingSource.loading

  async function toggle() {
    setFailed(false)
    try {
      if (kind === 'category') {
        if (isFollowing) await unfollowCategory({ variables: { id } })
        else await followCategory({ variables: { id } })
      } else {
        if (isFollowing) await unfollowSource({ variables: { id } })
        else await followSource({ variables: { id } })
      }
      await followed.refetch()
      onChange?.()
    } catch {
      setFailed(true)
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={Boolean(isFollowing)}
        aria-label={`${isFollowing ? 'Unfollow' : 'Follow'} ${kind} ${name}`}
        className="rounded-full border border-hub-accent px-3 py-1 text-sm font-semibold text-hub-accent disabled:opacity-60"
      >
        {isFollowing ? 'Following · Unfollow' : `Follow ${kind}`}
      </button>
      {failed && (
        <span role="alert" className="text-sm text-hub-muted">
          Could not update follow. Please try again.
        </span>
      )}
    </span>
  )
}
