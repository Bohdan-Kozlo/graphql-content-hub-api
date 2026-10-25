import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { Link } from 'react-router'
import { MyDraftsDocument, PublishEditorDraftDocument } from '@/shared/api/gql/graphql'

export default function DraftListPage() {
  const { data, loading, error, refetch } = useQuery(MyDraftsDocument, {
    fetchPolicy: 'network-only',
  })
  const [publish] = useMutation(PublishEditorDraftDocument)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [publishErrorId, setPublishErrorId] = useState<string | null>(null)
  const [published, setPublished] = useState<{ id: string; title: string } | null>(null)

  async function publishDraft(id: string, title: string) {
    setPublishingId(id)
    setPublishErrorId(null)
    try {
      await publish({ variables: { id } })
      setPublished({ id, title })
      void refetch().catch(() => undefined)
    } catch {
      setPublishErrorId(id)
    } finally {
      setPublishingId(null)
    }
  }

  const drafts = data?.myDrafts.filter((draft) => draft.id !== published?.id) ?? []
  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-hub-line pb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-hub-accent uppercase">
            Workspace
          </p>
          <h1 className="mt-3 font-hub-display text-5xl font-semibold">Your drafts</h1>
          <p className="mt-3 text-hub-muted">
            Your work in progress is private until published.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/editor/new"
            className="rounded-full bg-hub-accent px-6 py-3 font-semibold text-hub-page"
          >
            New article
          </Link>
          <Link
            to="/editor/new?type=news"
            className="rounded-full border border-hub-line px-6 py-3 font-semibold"
          >
            New news
          </Link>
          <Link
            to="/editor/new?type=video"
            className="rounded-full border border-hub-line px-6 py-3 font-semibold"
          >
            New video
          </Link>
          <Link
            to="/editor/new?type=podcast"
            className="rounded-full border border-hub-line px-6 py-3 font-semibold"
          >
            New podcast
          </Link>
        </div>
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
      {published && (
        <p role="status" className="mt-8 rounded-2xl border border-hub-line p-5">
          {published.title} is published.{' '}
          <Link
            to={`/content/${encodeURIComponent(published.id)}`}
            className="font-semibold text-hub-accent underline"
          >
            View published story
          </Link>
        </p>
      )}
      {!loading && !error && drafts.length === 0 && !published && (
        <p className="mt-10 text-hub-muted">No drafts yet. Start your first story.</p>
      )}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {drafts.map((draft) => (
          <li
            key={draft.id}
            className="rounded-3xl border border-hub-line bg-hub-surface p-6"
          >
            <span className="text-xs font-bold tracking-widest text-hub-accent uppercase">
              {draft.type.toLowerCase()} draft · {draft.category?.name ?? 'Uncategorized'}
            </span>
            <h2 className="mt-3 font-hub-display text-2xl font-semibold">
              {draft.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-hub-muted">{draft.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                to={`/editor/${encodeURIComponent(draft.id)}`}
                className="font-semibold text-hub-accent underline"
              >
                Open draft
              </Link>
              <button
                type="button"
                disabled={publishingId !== null}
                onClick={() => void publishDraft(draft.id, draft.title)}
                className="rounded-full bg-hub-accent px-5 py-2 font-semibold text-hub-page disabled:opacity-50"
              >
                {publishingId === draft.id ? 'Publishing…' : 'Publish'}
              </button>
            </div>
            {publishErrorId === draft.id && (
              <p role="alert" className="mt-4 text-red-600">
                Unable to publish this draft. Check that it is complete and try again.
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
