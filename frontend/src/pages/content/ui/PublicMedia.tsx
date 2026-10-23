import type { ContentType } from '@/shared/api/gql/graphql'
import { externalUrl } from '@/shared/lib/url'
import { embedUrl } from '../model/media-url'
import { MediaArtwork } from './MediaArtwork'

type Props = {
  type: ContentType
  title: string
  mediaUrl: string | null
  thumbnail: string | null
}

export default function PublicMedia({ type, title, mediaUrl, thumbnail }: Props) {
  const safeMediaUrl = externalUrl(mediaUrl)
  const playerUrl = embedUrl(type, mediaUrl)

  return (
    <>
      <MediaArtwork title={title} thumbnail={thumbnail} />
      {playerUrl && (
        <div
          className={`mt-6 overflow-hidden rounded-2xl bg-black ${type === 'PODCAST' ? 'h-[352px]' : 'aspect-video'}`}
        >
          <iframe
            src={playerUrl}
            title={`${type === 'VIDEO' ? 'Video' : 'Podcast'} player: ${title}`}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
      )}
      {!playerUrl && safeMediaUrl && (
        <a
          href={safeMediaUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-6 inline-block font-semibold text-hub-accent underline underline-offset-4"
        >
          Open original media
        </a>
      )}
    </>
  )
}
