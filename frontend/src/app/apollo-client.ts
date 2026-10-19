import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import type { Reference, StoreObject } from '@apollo/client'

export const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          publishedContents: {
            keyArgs: false,
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
