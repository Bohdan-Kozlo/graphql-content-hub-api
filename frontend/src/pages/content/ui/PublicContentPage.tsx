import { useQuery } from '@apollo/client/react'
import { useParams } from 'react-router'
import { PublicContentDocument } from '@/shared/api/gql/graphql'
import { ContentArticle } from './ContentArticle'
import { StatusMessage } from './StatusMessage'

export default function PublicContentPage() {
  const { id } = useParams<'id'>()
  const { data, loading, error } = useQuery(PublicContentDocument, {
    variables: { id: id ?? '' },
    skip: !id,
    fetchPolicy: 'network-only',
  })

  if (loading) {
    return (
      <p className="mx-auto max-w-6xl px-5 py-24 text-hub-muted" role="status">
        Loading story…
      </p>
    )
  }
  if (error) {
    return (
      <StatusMessage
        title="Unable to load content"
        message="Please try again in a moment."
      />
    )
  }

  const content = data?.content
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
