import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { Link } from 'react-router'
import {
  FollowAuthorDocument,
  ProfileFollowedAuthorsDocument,
  UnfollowAuthorDocument,
} from '@/shared/api/gql/graphql'

export function AuthorFollowButton({
  authorId,
  signedIn,
  isSelf,
}: {
  authorId: string
  signedIn: boolean
  isSelf: boolean
}) {
  const [failed, setFailed] = useState(false)
  const followed = useQuery(ProfileFollowedAuthorsDocument, {
    skip: !signedIn || isSelf,
    fetchPolicy: 'network-only',
  })
  const [follow, followState] = useMutation(FollowAuthorDocument)
  const [unfollow, unfollowState] = useMutation(UnfollowAuthorDocument)

  if (isSelf) return null
  if (!signedIn)
    return (
      <Link
        to="/login"
        state={{ from: `/users/${authorId}` }}
        className="mt-5 inline-block font-semibold text-hub-accent underline underline-offset-4"
      >
        Sign in to follow
      </Link>
    )
  if (followed.loading && !followed.data)
    return (
      <p role="status" className="mt-5 text-sm text-hub-muted">
        Loading follow status…
      </p>
    )
  if (followed.error)
    return (
      <div className="mt-5">
        <p role="alert">Unable to load follow status.</p>
        <button
          type="button"
          onClick={() => void followed.refetch()}
          className="font-semibold text-hub-accent underline"
        >
          Try again
        </button>
      </div>
    )

  const isFollowing =
    followed.data?.myFollowedAuthors.some((author) => author.id === authorId) ?? false
  async function toggle() {
    setFailed(false)
    try {
      if (isFollowing) await unfollow({ variables: { id: authorId } })
      else await follow({ variables: { id: authorId } })
      await followed.refetch()
    } catch {
      setFailed(true)
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={followState.loading || unfollowState.loading}
        className="rounded-full border border-hub-accent px-5 py-2 text-sm font-semibold text-hub-accent disabled:opacity-60"
        aria-pressed={isFollowing}
      >
        {isFollowing ? 'Following · Unfollow' : 'Follow author'}
      </button>
      {failed && (
        <p role="alert" className="mt-2 text-sm text-hub-muted">
          Could not update follow. Please try again.
        </p>
      )}
    </div>
  )
}
