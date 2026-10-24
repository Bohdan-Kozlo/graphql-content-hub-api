import { useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { useParams } from 'react-router'
import { CreateViewDocument, PublicContentDocument } from '@/shared/api/gql/graphql'
import { ContentArticle } from './ContentArticle'
import { StatusMessage } from './StatusMessage'

export default function PublicContentPage() {
  const { id } = useParams<'id'>()
  const viewRequest = useRef<{ contentId: string; requestId: string } | null>(null)
  const [createView] = useMutation(CreateViewDocument)
  const { data, loading, error, refetch } = useQuery(PublicContentDocument, {
    variables: { id: id ?? '' },
    skip: !id,
    fetchPolicy: 'network-only',
  })
  const content = data?.content

  useEffect(() => {
    if (!content || content.status !== 'PUBLISHED') return
    if (viewRequest.current?.contentId === content.id) return
    const requestId = crypto.randomUUID()
    viewRequest.current = { contentId: content.id, requestId }
    void createView({ variables: { data: { contentId: content.id, requestId } } })
      .then(() => refetch())
      .catch(() => undefined)
  }, [content, createView, refetch])

  if (loading && !content) {
    return (
      <p className="mx-auto max-w-6xl px-5 py-24 text-hub-muted" role="status">
        Loading story…
      </p>
    )
  }
  if (error && !content) {
    return (
      <StatusMessage
        title="Unable to load content"
        message="Please try again in a moment."
      />
    )
  }

  if (!content || content.status !== 'PUBLISHED') {
    return (
      <StatusMessage
        title="Content unavailable"
        message="This story is not available at this address."
      />
    )
  }

  return <ContentArticle key={content.id} content={content} />
}
