import type { useApolloClient } from '@apollo/client/react'

type Client = ReturnType<typeof useApolloClient>

export function invalidateEditorContent(client: Client, id?: string) {
  if (id) {
    client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'content', args: { id } })
    client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'myContent', args: { id } })
  }
  for (const fieldName of [
    'publishedContents',
    'myPublishedContents',
    'myDrafts',
    'followingFeed',
    'savedContents',
    'myViewHistory',
  ]) {
    client.cache.evict({ id: 'ROOT_QUERY', fieldName })
  }
  client.cache.gc()
}
