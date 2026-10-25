import type { ContentType } from '@/shared/api/gql/graphql'
import { PublicMedia } from '@/entities/content'

type Props = {
  type: ContentType
  title: string
  mediaUrl: string
  thumbnail: string
  duration: string
  categoryName: string
  tagNames: string[]
  preview: boolean
  onMediaUrlChange: (value: string) => void
  onThumbnailChange: (value: string) => void
  onDurationChange: (value: string) => void
  onPreviewChange: (value: boolean) => void
}

export function MediaDraftFields({
  type,
  title,
  mediaUrl,
  thumbnail,
  duration,
  categoryName,
  tagNames,
  preview,
  onMediaUrlChange,
  onThumbnailChange,
  onDurationChange,
  onPreviewChange,
}: Props) {
  const kind = type.toLowerCase()
  return (
    <div className="space-y-6">
      <label className="block font-semibold">
        Media URL
        <input
          type="url"
          required
          value={mediaUrl}
          onChange={(event) => onMediaUrlChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-hub-line bg-hub-page px-4 py-3"
        />
      </label>
      <label className="block font-semibold">
        Thumbnail URL (optional)
        <input
          type="url"
          value={thumbnail}
          onChange={(event) => onThumbnailChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-hub-line bg-hub-page px-4 py-3"
        />
      </label>
      <label className="block font-semibold">
        Duration in seconds (optional)
        <input
          type="number"
          min="0"
          step="1"
          value={duration}
          onChange={(event) => onDurationChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-hub-line bg-hub-page px-4 py-3"
        />
      </label>
      <button
        type="button"
        onClick={() => onPreviewChange(!preview)}
        className="text-sm font-semibold text-hub-accent underline"
      >
        {preview ? 'Hide preview' : 'Preview'}
      </button>
      {preview && (
        <div
          aria-label={`${kind} preview`}
          className="rounded-2xl border border-hub-line p-6"
        >
          <PublicMedia
            type={type}
            title={title || `Untitled ${kind}`}
            mediaUrl={mediaUrl}
            thumbnail={thumbnail}
          />
          <p className="mt-6 text-sm text-hub-muted">
            Category: {categoryName} · Tags: {tagNames.join(', ') || 'None'}
          </p>
        </div>
      )}
    </div>
  )
}
