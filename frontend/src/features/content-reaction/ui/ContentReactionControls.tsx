import { useState, useSyncExternalStore } from 'react'
import { useMutation } from '@apollo/client/react'
import { useLocation, useNavigate } from 'react-router'
import { getAccount, subscribeSession } from '@/entities/account'
import { ToggleContentReactionDocument } from '@/shared/api/gql/graphql'

type ReactionState = {
  id: string
  liked: boolean
  saved: boolean
  likeCount: number
}

type Props = {
  content: ReactionState
  onBookmarkRemoved?: () => void
}

function likeLabel(count: number) {
  return `${count} ${count === 1 ? 'like' : 'likes'}`
}

export function ContentReactionControls({ content, onBookmarkRemoved }: Props) {
  const account = useSyncExternalStore(subscribeSession, getAccount)
  const navigate = useNavigate()
  const location = useLocation()
  const [message, setMessage] = useState('')
  const [pendingType, setPendingType] = useState<'LIKE' | 'SAVE' | null>(null)
  const [toggleReaction] = useMutation(ToggleContentReactionDocument)
  const liked = content.liked ?? false
  const saved = content.saved ?? false
  const likeCount = content.likeCount ?? 0

  async function toggle(type: 'LIKE' | 'SAVE') {
    if (!account) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setMessage('')
    setPendingType(type)
    const optimisticState = {
      liked: type === 'LIKE' ? !liked : liked,
      saved: type === 'SAVE' ? !saved : saved,
      likeCount: type === 'LIKE' ? likeCount + (liked ? -1 : 1) : likeCount,
    }
    try {
      const result = await toggleReaction({
        variables: { data: { contentId: content.id, type } },
        optimisticResponse: {
          toggleContentReaction: {
            contentId: content.id,
            liked: optimisticState.liked,
            saved: optimisticState.saved,
            likeCount: optimisticState.likeCount,
          },
        },
        update(cache, { data }) {
          const state = data?.toggleContentReaction
          if (!state) return
          cache.modify({
            id: cache.identify({ __typename: 'ContentModel', id: state.contentId }),
            fields: {
              liked: () => state.liked,
              saved: () => state.saved,
              likeCount: () => state.likeCount,
            },
          })
        },
      })
      const confirmedState = result.data?.toggleContentReaction
      if (type === 'SAVE' && !confirmedState?.saved) onBookmarkRemoved?.()
    } catch {
      setMessage('Could not update this story. Please try again.')
    } finally {
      setPendingType(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3" aria-label="Story reactions">
      <button
        type="button"
        aria-pressed={liked}
        aria-label={liked ? 'Unlike' : 'Like'}
        onClick={() => void toggle('LIKE')}
        disabled={pendingType === 'LIKE'}
        className="rounded-full border border-hub-line px-4 py-2 text-sm font-semibold text-hub-ink hover:border-hub-accent hover:text-hub-accent disabled:cursor-wait disabled:opacity-60"
      >
        {liked ? 'Liked' : 'Like'}
      </button>
      <span aria-live="polite" className="text-sm text-hub-muted">
        {likeLabel(likeCount)}
      </span>
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? 'Remove bookmark' : 'Save'}
        onClick={() => void toggle('SAVE')}
        disabled={pendingType === 'SAVE'}
        className="rounded-full border border-hub-line px-4 py-2 text-sm font-semibold text-hub-ink hover:border-hub-accent hover:text-hub-accent disabled:cursor-wait disabled:opacity-60"
      >
        {saved ? 'Saved' : 'Save'}
      </button>
      {message && (
        <p role="alert" className="basis-full text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  )
}
