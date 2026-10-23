import { useState } from 'react'
import { externalUrl } from '@/shared/lib/url'

type AvatarProps = {
  username: string
  url: string | null | undefined
  size?: 'small' | 'large'
}

export function Avatar({ username, url, size = 'large' }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const imageUrl = externalUrl(url)
  const sizeClass = size === 'small' ? 'size-11 text-lg' : 'size-24 text-4xl sm:size-32'

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-hub-lilac font-hub-display font-semibold text-hub-ink ${sizeClass}`}
    >
      {imageUrl && imageUrl !== failedUrl ? (
        <img
          src={imageUrl}
          alt={`${username}'s avatar`}
          className="size-full object-cover"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <span role="img" aria-label={`Default avatar for ${username}`}>
          {username.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}
