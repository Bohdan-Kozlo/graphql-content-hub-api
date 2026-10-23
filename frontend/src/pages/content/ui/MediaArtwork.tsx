import { useState } from 'react'
import { externalUrl } from '@/shared/lib/url'

export function MediaArtwork({
  title,
  thumbnail,
}: {
  title: string
  thumbnail: string | null
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const imageUrl = externalUrl(thumbnail)

  if (imageUrl && imageUrl !== failedUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${title} thumbnail`}
        onError={() => setFailedUrl(imageUrl)}
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
