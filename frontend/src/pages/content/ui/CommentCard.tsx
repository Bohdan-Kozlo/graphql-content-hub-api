import { Link } from 'react-router'
import type { ContentCommentsQuery } from '@/shared/api/gql/graphql'
import { Avatar } from '@/shared/ui/avatar'

type Comment = ContentCommentsQuery['commentsByContent'][number]
type Account = { id: string; roles: string[] } | null

export function CommentCard({
  comment,
  account,
  pending,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: Comment | NonNullable<Comment['replies']>[number]
  account: Account
  pending: boolean
  onReply?: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const canEdit = !comment.isDeleted && account?.id === comment.user.id
  const canDelete = !comment.isDeleted && (canEdit || account?.roles.includes('ADMIN'))
  return (
    <article className="rounded-2xl border border-hub-line bg-hub-surface p-5">
      <div className="flex items-center gap-3">
        <Avatar
          username={comment.user.username}
          url={comment.user.avatarUrl}
          size="small"
        />
        <div>
          <Link
            to={`/users/${encodeURIComponent(comment.user.id)}`}
            className="font-semibold text-hub-accent underline underline-offset-4"
          >
            {comment.user.username}
          </Link>
          <time dateTime={comment.createdAt} className="block text-xs text-hub-muted">
            {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
              new Date(comment.createdAt),
            )}
          </time>
        </div>
      </div>
      <p
        className={`mt-4 whitespace-pre-wrap break-words ${comment.isDeleted ? 'italic text-hub-muted' : ''}`}
      >
        {comment.isDeleted ? 'Comment removed' : comment.text}
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-hub-accent">
        {account && onReply && !comment.isDeleted && (
          <button type="button" onClick={onReply} disabled={pending}>
            Reply
          </button>
        )}
        {canEdit && (
          <button type="button" onClick={onEdit} disabled={pending}>
            Edit
          </button>
        )}
        {canDelete && (
          <button type="button" onClick={onDelete} disabled={pending}>
            Remove
          </button>
        )}
      </div>
    </article>
  )
}
