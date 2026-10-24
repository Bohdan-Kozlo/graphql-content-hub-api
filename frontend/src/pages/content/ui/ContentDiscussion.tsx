import { useRef, useState, useSyncExternalStore } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { Link, useLocation, useNavigate } from 'react-router'
import { getAccount, subscribeSession } from '@/entities/account'
import {
  ContentCommentsDocument,
  CreateContentCommentDocument,
  DeleteContentCommentDocument,
  UpdateContentCommentDocument,
} from '@/shared/api/gql/graphql'
import { CommentCard } from './CommentCard'

export function ContentDiscussion({ contentId }: { contentId: string }) {
  const account = useSyncExternalStore(subscribeSession, getAccount)
  const navigate = useNavigate()
  const location = useLocation()
  const { data, loading, error, refetch } = useQuery(ContentCommentsDocument, {
    variables: { contentId },
    fetchPolicy: 'network-only',
  })
  const [createComment] = useMutation(CreateContentCommentDocument)
  const [updateComment] = useMutation(UpdateContentCommentDocument)
  const [deleteComment] = useMutation(DeleteContentCommentDocument)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function requireAccount() {
    if (account) return true
    navigate('/login', { state: { from: location.pathname } })
    return false
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requireAccount() || !text.trim() || pending) return
    setPending(true)
    setMessage('')
    try {
      if (editId) {
        await updateComment({ variables: { id: editId, data: { text: text.trim() } } })
      } else {
        await createComment({
          variables: { data: { contentId, text: text.trim(), parentId: replyTo } },
        })
      }
      await refetch()
      setText('')
      setReplyTo(null)
      setEditId(null)
    } catch {
      setMessage('Could not save your comment. Please try again.')
    } finally {
      setPending(false)
    }
  }

  async function remove(id: string) {
    if (!requireAccount() || pending) return
    setPending(true)
    setMessage('')
    try {
      await deleteComment({ variables: { id } })
      await refetch()
      if (editId === id || replyTo === id) cancel()
    } catch {
      setMessage('Could not remove this comment. Please try again.')
    } finally {
      setPending(false)
    }
  }

  function cancel() {
    setText('')
    setReplyTo(null)
    setEditId(null)
    setMessage('')
  }

  const comments = data?.commentsByContent ?? []
  const replyAuthor = comments.find((comment) => comment.id === replyTo)?.user.username

  return (
    <section
      aria-labelledby="discussion-title"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8"
    >
      <div className="border-t border-hub-line pt-10">
        <h2 id="discussion-title" className="font-hub-display text-3xl font-semibold">
          Discussion
        </h2>
        <p className="mt-2 text-hub-muted">Share a thought or reply to a reader.</p>
      </div>

      {account ? (
        <form
          onSubmit={(event) => void submit(event)}
          className="mt-7 max-w-2xl space-y-3"
        >
          <label htmlFor="comment-text" className="block font-semibold">
            {editId
              ? 'Edit comment'
              : replyTo
                ? `Reply to ${replyAuthor ?? 'comment'}`
                : 'Write a comment'}
          </label>
          <textarea
            ref={textareaRef}
            id="comment-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={2000}
            required
            rows={4}
            className="w-full rounded-xl border border-hub-line bg-hub-surface px-4 py-3 text-hub-ink"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending || !text.trim()}
              className="rounded-full bg-hub-accent px-5 py-2 font-semibold text-white disabled:opacity-50"
            >
              {pending
                ? 'Saving…'
                : editId
                  ? 'Save edit'
                  : replyTo
                    ? 'Post reply'
                    : 'Post comment'}
            </button>
            {(replyTo || editId) && (
              <button
                type="button"
                onClick={cancel}
                className="rounded-full border border-hub-line px-5 py-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <p className="mt-7 text-hub-muted">
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="font-semibold text-hub-accent underline"
          >
            Sign in
          </Link>{' '}
          to join the discussion.
        </p>
      )}
      {message && (
        <p role="alert" className="mt-3 text-red-600">
          {message}
        </p>
      )}

      {loading && !data && (
        <p role="status" className="mt-8 text-hub-muted">
          Loading comments…
        </p>
      )}
      {error && (
        <div role="alert" className="mt-8 text-hub-muted">
          Unable to load comments.{' '}
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-hub-accent underline"
          >
            Try again
          </button>
        </div>
      )}
      {!loading && !error && comments.length === 0 && (
        <p className="mt-8 text-hub-muted">No comments yet. Start the conversation.</p>
      )}
      <div className="mt-8 max-w-2xl space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-4">
            <CommentCard
              comment={comment}
              account={account}
              pending={pending}
              onReply={() => {
                if (requireAccount()) {
                  setReplyTo(comment.id)
                  setEditId(null)
                  setText('')
                  textareaRef.current?.focus()
                }
              }}
              onEdit={() => {
                setEditId(comment.id)
                setReplyTo(null)
                setText(comment.text)
                textareaRef.current?.focus()
              }}
              onDelete={() => void remove(comment.id)}
            />
            {comment.replies?.map((reply) => (
              <div
                key={reply.id}
                className="ml-5 border-l border-hub-line pl-5 sm:ml-10 sm:pl-7"
              >
                <CommentCard
                  comment={reply}
                  account={account}
                  pending={pending}
                  onEdit={() => {
                    setEditId(reply.id)
                    setReplyTo(null)
                    setText(reply.text)
                    textareaRef.current?.focus()
                  }}
                  onDelete={() => void remove(reply.id)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
