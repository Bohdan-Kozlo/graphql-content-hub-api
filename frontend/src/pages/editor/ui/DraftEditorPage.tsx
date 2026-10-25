import { useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery } from '@apollo/client/react'
import { Link, useParams, useSearchParams } from 'react-router'
import {
  EditorMetadataOptionsDocument,
  MyContentDocument,
} from '@/shared/api/gql/graphql'
import type { ContentType } from '@/shared/api/gql/graphql'
import { RichTextEditor } from './RichTextEditor'
import { ArticleBody } from '@/entities/content'
import { useEditorWorkflow } from '../model/use-editor-workflow'
import { MediaDraftFields } from './MediaDraftFields'

const emptyBody = JSON.stringify({
  version: 1,
  type: 'doc',
  content: [{ type: 'paragraph' }],
})

export default function DraftEditorPage() {
  const { id } = useParams<'id'>()
  const [searchParams] = useSearchParams()
  const workflow = useEditorWorkflow()
  const existing = Boolean(id)
  const draft = useQuery(MyContentDocument, {
    variables: { id: id ?? '' },
    skip: !id,
    fetchPolicy: 'network-only',
  })
  const metadataOptions = useQuery(EditorMetadataOptionsDocument)
  const [title, setTitle] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [body, setBody] = useState<string | null>(null)
  const [tagIds, setTagIds] = useState<string[] | null>(null)
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [duration, setDuration] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const saved = draft.data?.myContent
  const isPublished = saved?.status === 'PUBLISHED'
  const requestedType = searchParams.get('type')?.toUpperCase()
  const type: ContentType =
    saved?.type ??
    (requestedType === 'NEWS' || requestedType === 'VIDEO' || requestedType === 'PODCAST'
      ? requestedType
      : 'ARTICLE')
  const isNews = type === 'NEWS'
  const isMedia = type === 'VIDEO' || type === 'PODCAST'
  const kind = type.toLowerCase()
  const currentTitle = title ?? saved?.title ?? ''
  const currentDescription = description ?? saved?.description ?? ''
  const currentCategory = categoryId ?? saved?.category?.id ?? ''
  const currentBody = body ?? saved?.body ?? emptyBody
  const currentTagIds = tagIds ?? saved?.tags.map((tag) => tag.id) ?? []
  const currentSourceId = sourceId ?? saved?.source?.id ?? ''
  const currentMediaUrl = mediaUrl ?? saved?.mediaUrl ?? ''
  const currentThumbnail = thumbnail ?? saved?.thumbnail ?? ''
  const currentDuration =
    duration ?? (saved?.duration == null ? '' : String(saved.duration))
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

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void workflow.save(id, {
      title: currentTitle,
      description: currentDescription,
      categoryId: currentCategory,
      tagIds: currentTagIds,
      sourceId: currentSourceId,
      body: currentBody,
      bodyChanged: body !== null,
      mediaUrl: currentMediaUrl,
      thumbnail: currentThumbnail,
      duration: currentDuration,
      type,
    })
  }

  if (existing && draft.loading && !saved)
    return (
      <p role="status" className="mx-auto max-w-4xl px-5 py-24">
        Loading content…
      </p>
    )
  if (existing && (draft.error || !saved))
    return (
      <div role="alert" className="mx-auto max-w-4xl px-5 py-24">
        Content unavailable.{' '}
        <Link to="/editor" className="underline">
          Back to your content
        </Link>
      </div>
    )
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <Link to="/editor" className="text-sm font-semibold text-hub-accent underline">
        ← Your content
      </Link>
      <p className="mt-10 text-xs font-bold tracking-[0.22em] text-hub-accent uppercase">
        {isPublished ? `Published ${kind}` : `Private ${kind} draft`}
      </p>
      <h1 className="mt-3 font-hub-display text-5xl font-semibold">
        {existing ? `Edit ${kind}` : `New ${kind}`}
      </h1>
      <form onSubmit={save} className="mt-10 space-y-6">
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
        {isMedia ? (
          <MediaDraftFields
            type={type}
            title={currentTitle}
            mediaUrl={currentMediaUrl}
            thumbnail={currentThumbnail}
            duration={currentDuration}
            categoryName={selectedCategory?.name ?? 'None'}
            tagNames={selectedTags.map((tag) => tag.name)}
            preview={preview}
            onMediaUrlChange={setMediaUrl}
            onThumbnailChange={setThumbnail}
            onDurationChange={setDuration}
            onPreviewChange={setPreview}
          />
        ) : (
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
                    <p>
                      Tags: {selectedTags.map((tag) => tag.name).join(', ') || 'None'}
                    </p>
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
        )}
        {workflow.error && (
          <p role="alert" className="text-red-600">
            {workflow.error}
          </p>
        )}
        <button
          disabled={workflow.saving || metadataOptions.loading}
          type="submit"
          className="rounded-full bg-hub-accent px-7 py-3 font-semibold text-hub-page disabled:opacity-50"
        >
          {workflow.saving ? 'Saving…' : isPublished ? 'Save changes' : 'Save draft'}
        </button>
        {existing && (
          <button
            type="button"
            disabled={workflow.removing || workflow.saving}
            onClick={() => void workflow.deleteContent(id, saved?.title)}
            className="ml-4 rounded-full border border-red-600 px-7 py-3 font-semibold text-red-600 disabled:opacity-50"
          >
            {workflow.removing ? 'Deleting…' : 'Delete content'}
          </button>
        )}
      </form>
    </div>
  )
}
