import { useState } from 'react'
import type { ContentType } from '../../gql/graphql'
import { externalUrl } from '../../shared/external-url'

type PublicMediaProps = {
  type: ContentType
  title: string
  mediaUrl: string | null
  thumbnail: string | null
}

function embedUrl(type: ContentType, mediaUrl: string | null) {
  const safeUrl = externalUrl(mediaUrl)
  if (!safeUrl) return null

  const url = new URL(safeUrl)
  if (
    type === 'VIDEO' &&
    ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(
      url.hostname,
    )
  ) {
    const path = url.pathname.split('/').filter(Boolean)
    const videoId =
      url.hostname === 'youtu.be'
        ? path[0]
        : path[0] === 'watch'
          ? url.searchParams.get('v')
          : ['embed', 'shorts', 'live'].includes(path[0] ?? '')
            ? path[1]
            : null
    return videoId && /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null
  }

  if (type === 'PODCAST' && ['open.spotify.com', 'spotify.com'].includes(url.hostname)) {
    const [, mediaKind, episodeId] = url.pathname.split('/')
    if (
      (mediaKind === 'episode' || mediaKind === 'show') &&
      /^[A-Za-z0-9]{22}$/.test(episodeId ?? '')
    ) {
      return `https://open.spotify.com/embed/${mediaKind}/${episodeId}`
    }
  }

  return null
}

function MediaArtwork({
  title,
  thumbnail,
}: {
  title: string
  thumbnail: string | null
}) {
  const [failed, setFailed] = useState(false)
  const imageUrl = externalUrl(thumbnail)

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={`${title} thumbnail`}
        onError={() => setFailed(true)}
        className="mt-10 aspect-video w-full rounded-2xl object-cover"
      />
    )
  }

  return (
    <div
      className="relative mt-10 aspect-video overflow-hidden rounded-2xl bg-hub-lilac"
      role="img"
      aria-label="Abstract story illustration"
    >
      <div className="absolute -top-20 right-[5%] size-64 rounded-full bg-hub-peach opacity-90 sm:size-96" />
      <div className="absolute -bottom-36 left-[8%] h-72 w-[78%] rotate-[-17deg] rounded-[50%] bg-hub-accent opacity-70 sm:h-96" />
      <div className="absolute right-[12%] bottom-[-25%] size-48 rounded-full border-[26px] border-hub-page opacity-70 sm:size-64" />
    </div>
  )
}

export default function PublicMedia({
  type,
  title,
  mediaUrl,
  thumbnail,
}: PublicMediaProps) {
  const safeMediaUrl = externalUrl(mediaUrl)
  const playerUrl = embedUrl(type, mediaUrl)

  return (
    <>
      <MediaArtwork title={title} thumbnail={thumbnail} />
      {playerUrl ? (
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
      ) : safeMediaUrl ? (
        <a
          href={safeMediaUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-6 inline-block font-semibold text-hub-accent underline underline-offset-4"
        >
          Open original media
        </a>
      ) : null}
    </>
  )
}
