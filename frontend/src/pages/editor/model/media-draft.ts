import { externalUrl } from '@/shared/lib/url'

export function mediaDraftError(mediaUrl: string, thumbnail: string, duration: string) {
  if (!externalUrl(mediaUrl) || (thumbnail && !externalUrl(thumbnail))) {
    return 'Enter a valid HTTP(S) media URL and thumbnail URL.'
  }
  if (duration && (!/^\d+$/.test(duration) || Number(duration) > 2147483647)) {
    return 'Duration must be a non-negative number of seconds.'
  }
  return null
}

export function mediaDraftFields(mediaUrl: string, thumbnail: string, duration: string) {
  return {
    mediaUrl: mediaUrl.trim(),
    thumbnail: thumbnail.trim() || null,
    duration: duration ? Number(duration) : null,
  }
}
