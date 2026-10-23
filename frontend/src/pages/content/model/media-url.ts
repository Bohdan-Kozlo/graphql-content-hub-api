import type { ContentType } from '@/shared/api/gql/graphql'
import { externalUrl } from '@/shared/lib/url'

const youtubeHosts = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
])
const spotifyHosts = new Set(['open.spotify.com', 'spotify.com'])

function youtubeVideoId(url: URL) {
  const path = url.pathname.split('/').filter(Boolean)
  if (url.hostname === 'youtu.be') return path[0]
  if (path[0] === 'watch') return url.searchParams.get('v')
  if (['embed', 'shorts', 'live'].includes(path[0] ?? '')) return path[1]
  return null
}

export function embedUrl(type: ContentType, mediaUrl: string | null) {
  const safeUrl = externalUrl(mediaUrl)
  if (!safeUrl) return null
  const url = new URL(safeUrl)

  if (type === 'VIDEO' && youtubeHosts.has(url.hostname)) {
    const videoId = youtubeVideoId(url)
    if (videoId && /^[\w-]{11}$/.test(videoId)) {
      return `https://www.youtube-nocookie.com/embed/${videoId}`
    }
  }

  if (type === 'PODCAST' && spotifyHosts.has(url.hostname)) {
    const [, mediaKind, mediaId] = url.pathname.split('/')
    const supported = mediaKind === 'episode' || mediaKind === 'show'
    if (supported && /^[A-Za-z0-9]{22}$/.test(mediaId ?? '')) {
      return `https://open.spotify.com/embed/${mediaKind}/${mediaId}`
    }
  }

  return null
}
