import { useState } from 'react'
import { Link } from 'react-router'
import type { PublicCatalogQuery } from '@/shared/api/gql/graphql'
import { externalUrl } from '@/shared/lib/url'
import { contentTypeNames } from '../model/catalog-filters'

export type CatalogItem = PublicCatalogQuery['publishedContents']['items'][number]
type CardVariant = 'featured' | 'shelf' | 'list'

const variantClasses: Record<
  CardVariant,
  { link: string; artwork: string; title: string }
> = {
  featured: {
    link: 'block',
    artwork: 'h-64 sm:h-80',
    title: 'text-3xl sm:text-4xl',
  },
  shelf: {
    link: 'grid grid-cols-[minmax(100px,35%)_minmax(0,1fr)] items-start gap-4 sm:gap-6',
    artwork: 'h-28 sm:h-32',
    title: 'text-xl',
  },
  list: {
    link: 'grid grid-cols-[minmax(100px,35%)_minmax(0,1fr)] items-start gap-4 sm:gap-6',
    artwork: 'h-32 sm:h-44',
    title: 'text-2xl sm:text-3xl',
  },
}

function publishedDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function StoryArtwork({ item }: { item: CatalogItem }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const imageUrl = externalUrl(item.thumbnail)

  return (
    <div className="relative h-full overflow-hidden rounded-xl bg-hub-lilac">
      {imageUrl && imageUrl !== failedUrl ? (
        <img
          src={imageUrl}
          alt=""
          onError={() => setFailedUrl(imageUrl)}
          className="size-full object-cover"
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-12 -bottom-24 size-64 rounded-full bg-hub-peach opacity-80" />
          <div className="absolute -top-20 -left-16 size-64 rounded-full border-[38px] border-hub-accent opacity-75" />
        </div>
      )}
      <span className="absolute bottom-3 left-3 rounded-full bg-hub-page px-3 py-1 text-xs font-bold tracking-wide text-hub-ink">
        {contentTypeNames[item.type]}
      </span>
    </div>
  )
}

export function StoryCard({
  item,
  variant,
}: {
  item: CatalogItem
  variant: CardVariant
}) {
  const date = publishedDate(item.publishedAt)
  const classes = variantClasses[variant]

  return (
    <article className="min-w-0">
      <Link
        to={`/content/${item.id}`}
        className={`group rounded-xl focus-visible:rounded-xl ${classes.link}`}
        aria-label={`Read ${item.title}`}
      >
        <div className={classes.artwork}>
          <StoryArtwork item={item} />
        </div>
        <div className={variant === 'featured' ? 'mt-6' : 'min-w-0'}>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-hub-muted">
            {item.category && <span>{item.category.name}</span>}
            {date && <time dateTime={item.publishedAt ?? undefined}>{date}</time>}
          </div>
          <h3
            className={`mt-2 font-hub-display leading-tight font-semibold tracking-tight group-hover:text-hub-accent ${classes.title}`}
          >
            {item.title}
          </h3>
          {variant !== 'shelf' && (
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-hub-muted sm:text-base">
              {item.description}
            </p>
          )}
          <p className="mt-3 text-sm font-semibold text-hub-ink">
            {item.author.username}
          </p>
        </div>
      </Link>
    </article>
  )
}
