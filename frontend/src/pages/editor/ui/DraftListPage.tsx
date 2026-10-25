import { useQuery } from '@apollo/client/react'
import { Link } from 'react-router'
import { MyDraftsDocument } from '@/shared/api/gql/graphql'

export default function DraftListPage() {
  const { data, loading, error, refetch } = useQuery(MyDraftsDocument, {
    fetchPolicy: 'network-only',
  })
  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-hub-line pb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-hub-accent uppercase">
            Workspace
          </p>
          <h1 className="mt-3 font-hub-display text-5xl font-semibold">Your drafts</h1>
          <p className="mt-3 text-hub-muted">
            Articles in progress are private until published.
          </p>
        </div>
        <Link
          to="/editor/new"
          className="rounded-full bg-hub-accent px-6 py-3 font-semibold text-hub-page"
        >
          New article
        </Link>
      </div>
      {loading && (
        <p role="status" className="mt-10">
          Loading drafts…
        </p>
      )}
      {error && (
        <div role="alert" className="mt-10">
          Unable to load drafts.{' '}
          <button type="button" onClick={() => void refetch()} className="underline">
            Try again
          </button>
        </div>
      )}
      {!loading && !error && data?.myDrafts.length === 0 && (
        <p className="mt-10 text-hub-muted">No drafts yet. Start your first article.</p>
      )}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {data?.myDrafts.map((draft) => (
          <li
            key={draft.id}
            className="rounded-3xl border border-hub-line bg-hub-surface p-6"
          >
            <span className="text-xs font-bold tracking-widest text-hub-accent uppercase">
              Draft · {draft.category?.name ?? 'Uncategorized'}
            </span>
            <h2 className="mt-3 font-hub-display text-2xl font-semibold">
              {draft.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-hub-muted">{draft.description}</p>
            <Link
              to={`/editor/${encodeURIComponent(draft.id)}`}
              className="mt-5 inline-block font-semibold text-hub-accent underline"
            >
              Open draft
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
