import { useState } from 'react'
import { useSearchParams } from 'react-router'
import type { ContentType, DiscoveryFiltersQuery } from '@/shared/api/gql/graphql'

export const contentTypeNames = {
  ARTICLE: 'Article',
  VIDEO: 'Video',
  PODCAST: 'Podcast',
  NEWS: 'News',
} as const satisfies Record<ContentType, string>

export type CatalogFilterValues = {
  search: string | null
  type: ContentType | null
  categoryId: string | null
  tagId: string | null
  authorId: string | null
}

type FilterName = keyof CatalogFilterValues
type Category = DiscoveryFiltersQuery['categories'][number]

export function categoryOptions(categories: Category[]) {
  const byParent = new Map<string | null, Category[]>()
  const ids = new Set(categories.map((item) => item.id))

  for (const item of categories) {
    const parentId = item.parent && ids.has(item.parent.id) ? item.parent.id : null
    const siblings = byParent.get(parentId) ?? []
    siblings.push(item)
    byParent.set(parentId, siblings)
  }

  const options: { id: string; label: string }[] = []
  const visited = new Set<string>()

  function addChildren(parentId: string | null, depth: number) {
    const children = [...(byParent.get(parentId) ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name),
    )
    for (const item of children) {
      if (visited.has(item.id)) continue
      visited.add(item.id)
      options.push({ id: item.id, label: `${'↳ '.repeat(depth)}${item.name}` })
      addChildren(item.id, depth + 1)
    }
  }

  addChildren(null, 0)
  return options
}

export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search')?.trim() ?? ''
  const rawType = searchParams.get('type')
  const type =
    rawType && Object.hasOwn(contentTypeNames, rawType) ? (rawType as ContentType) : null
  const values: CatalogFilterValues = {
    search: search || null,
    type,
    categoryId: searchParams.get('categoryId') || null,
    tagId: searchParams.get('tagId') || null,
    authorId: searchParams.get('authorId') || null,
  }
  const active = Object.values(values).some(Boolean)
  const [draft, setDraft] = useState({ search, value: search })
  const searchDraft = draft.search === search ? draft.value : search

  function setFilter(name: FilterName, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    setSearchParams(next)
  }

  return {
    values,
    active,
    searchDraft,
    setSearchDraft: (value: string) => setDraft({ search, value }),
    setFilter,
    clearFilters: () => setSearchParams({}),
  }
}
