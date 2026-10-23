import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import type { Reference, StoreObject } from '@apollo/client'
import { getAccessToken, refreshAccessToken } from '@/entities/account'

const authenticatedFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers)
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const request = { ...init, headers, credentials: 'same-origin' as const }
  const response = await fetch(input, request)
  const body = await response
    .clone()
    .json()
    .catch(() => null)
  const expired = body?.errors?.some(
    (error: { extensions?: { code?: string } }) =>
      error.extensions?.code === 'UNAUTHENTICATED',
  )
  if (!expired || !token) return response
  const renewed = await refreshAccessToken()
  if (!renewed) return response
  headers.set('Authorization', `Bearer ${renewed}`)
  return fetch(input, { ...request, headers })
}

export const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql', fetch: authenticatedFetch }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          publishedContents: {
            keyArgs: ['search', 'type', 'categoryId', 'tagId', 'authorId'],
            merge(existing, incoming, { args, readField }) {
              if (!args?.after || !existing) return incoming
              const seen = new Set(
                existing.items.map((item: Reference | StoreObject) =>
                  readField('id', item),
                ),
              )
              return {
                ...incoming,
                items: [
                  ...existing.items,
                  ...incoming.items.filter((item: Reference | StoreObject) => {
                    const id = readField('id', item)
                    if (seen.has(id)) return false
                    seen.add(id)
                    return true
                  }),
                ],
              }
            },
          },
        },
      },
    },
  }),
})
