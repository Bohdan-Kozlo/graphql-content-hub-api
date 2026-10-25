import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  CreateEditorDraftDocument,
  EditorMetadataOptionsDocument,
  MyDraftDocument,
  UpdateEditorDraftDocument,
} from '@/shared/api/gql/graphql'
import { RichTextEditor } from './RichTextEditor'
import { ArticleBody } from '@/entities/content'

const emptyBody = JSON.stringify({
  version: 1,
  type: 'doc',
  content: [{ type: 'paragraph' }],
})

export default function DraftEditorPage() {
  const { id } = useParams<'id'>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const existing = Boolean(id)
  const draft = useQuery(MyDraftDocument, {
    variables: { id: id ?? '' },
    skip: !id,
    fetchPolicy: 'network-only',
  })
  const metadataOptions = useQuery(EditorMetadataOptionsDocument)
  const [create, creating] = useMutation(CreateEditorDraftDocument)
  const [update, updating] = useMutation(UpdateEditorDraftDocument)
  const [error, setError] = useState('')
  const [title, setTitle] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [body, setBody] = useState<string | null>(null)
  const [tagIds, setTagIds] = useState<string[] | null>(null)
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const saved = draft.data?.myDraft
  const isNews = saved ? saved.type === 'NEWS' : searchParams.get('type') === 'news'
  const kind = isNews ? 'news' : 'article'
  const currentTitle = title ?? saved?.title ?? ''
  const currentDescription = description ?? saved?.description ?? ''
  const currentCategory = categoryId ?? saved?.category?.id ?? ''
  const currentBody = body ?? saved?.body ?? emptyBody
  const currentTagIds = tagIds ?? saved?.tags.map((tag) => tag.id) ?? []
  const currentSourceId = sourceId ?? saved?.source?.id ?? ''
  const selectedCategory = metadataOptions.data?.categories.find(
    (item) => item.id === currentCategory,
  )
  const selectedTags =
    metadataOptions.data?.tags.filter((tag) => currentTagIds.includes(tag.id)) ?? []
  const selectedSource = metadataOptions.data?.sources.find(
    (source) => source.id === currentSourceId,
  )

  function toggleTag(id: string) {
    setTagIds(
      currentTagIds.includes(id)
        ? currentTagIds.filter((tagId) => tagId !== id)
        : [...currentTagIds, id],
    )
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!currentTitle.trim() || !currentDescription.trim() || !currentCategory) {
      setError('Complete the title, description, and category.')
      return
    }
    try {
      if (id) {
        await update({
          variables: {
            id,
            data: {
              title: currentTitle.trim(),
              description: currentDescription.trim(),
              categoryId: currentCategory,
              ...(isNews
                ? { tagIds: currentTagIds, sourceId: currentSourceId || null }
                : {}),
              ...(body !== null ? { body } : {}),
            },
          },
        })
        navigate('/editor')
      } else {
        const result = await create({
          variables: {
            data: {
              title: currentTitle.trim(),
              description: currentDescription.trim(),
              categoryId: currentCategory,
              body: currentBody,
              type: isNews ? 'NEWS' : 'ARTICLE',
              ...(isNews
                ? { tagIds: currentTagIds, sourceId: currentSourceId || undefined }
                : {}),
            },
          },
        })
        navigate(`/editor/${result.data?.createContent.id}`)
      }
    } catch {
      setError('Unable to save this draft. Please try again.')
    }
  }

  if (existing && draft.loading && !saved)
    return (
      <p role="status" className="mx-auto max-w-4xl px-5 py-24">
        Loading draft…
      </p>
    )
  if (existing && (draft.error || !saved))
    return (
      <div role="alert" className="mx-auto max-w-4xl px-5 py-24">
        Draft unavailable.{' '}
        <Link to="/editor" className="underline">
          Back to drafts
        </Link>
      </div>
    )
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <Link to="/editor" className="text-sm font-semibold text-hub-accent underline">
        ← Your drafts
      </Link>
      <p className="mt-10 text-xs font-bold tracking-[0.22em] text-hub-accent uppercase">
        Private {kind} draft
      </p>
      <h1 className="mt-3 font-hub-display text-5xl font-semibold">
        {existing ? `Edit ${kind}` : `New ${kind}`}
      </h1>
      <form onSubmit={(event) => void save(event)} className="mt-10 space-y-6">
        <label className="block font-semibold">
          Title
          <input
            required
            value={currentTitle}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-xl border border-hub-line bg-hub-page px-4 py-3"
          />
        </label>
        <label className="block font-semibold">
          Description
          <textarea
            required
            rows={3}
            value={currentDescription}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 w-full rounded-xl border border-hub-line bg-hub-page px-4 py-3"
          />
        </label>
        <label className="block font-semibold">
          Primary category
          <select
            required
            value={currentCategory}
            onChange={(event) => setCategoryId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-hub-line bg-hub-page px-4 py-3"
          >
            <option value="">Choose a category</option>
            {metadataOptions.data?.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {metadataOptions.error && (
          <p role="alert">
            Unable to load categories.{' '}
            <button
              type="button"
              onClick={() => void metadataOptions.refetch()}
              className="underline"
            >
              Try again
            </button>
          </p>
        )}
        {isNews && (
          <>
            <fieldset className="space-y-3">
              <legend className="font-semibold">Tags</legend>
              {metadataOptions.data?.tags.length === 0 && (
                <p className="text-sm text-hub-muted">No tags available.</p>
              )}
              <div className="flex flex-wrap gap-4">
                {metadataOptions.data?.tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentTagIds.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block font-semibold">
              Source (optional)
              <select
                value={currentSourceId}
                onChange={(event) => setSourceId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-hub-line bg-hub-page px-4 py-3"
              >
                <option value="">No source</option>
                {metadataOptions.data?.sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="font-semibold">{isNews ? 'News text' : 'Article text'}</p>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-sm font-semibold text-hub-accent underline"
            >
              {preview ? 'Edit text' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div
              aria-label={isNews ? 'News preview' : 'Article preview'}
              className="min-h-64 space-y-5 rounded-2xl border border-hub-line bg-hub-page p-6 leading-8"
            >
              <ArticleBody body={currentBody} />
              {isNews && (
                <div className="border-t border-hub-line pt-4 text-sm text-hub-muted">
                  <p>Category: {selectedCategory?.name ?? 'None'}</p>
                  <p>Tags: {selectedTags.map((tag) => tag.name).join(', ') || 'None'}</p>
                  <p>Source: {selectedSource?.name ?? 'None'}</p>
                </div>
              )}
            </div>
          ) : (
            <RichTextEditor
              key={id ?? 'new'}
              initialBody={currentBody}
              onChange={setBody}
              label={isNews ? 'News text' : 'Article text'}
            />
          )}
        </div>
        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}
        <button
          disabled={creating.loading || updating.loading || metadataOptions.loading}
          type="submit"
          className="rounded-full bg-hub-accent px-7 py-3 font-semibold text-hub-page disabled:opacity-50"
        >
          {creating.loading || updating.loading ? 'Saving…' : 'Save draft'}
        </button>
      </form>
    </div>
  )
}
