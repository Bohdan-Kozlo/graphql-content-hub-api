import { useQuery } from '@apollo/client/react'
import { Link, useParams } from 'react-router'
import { PublicContentDocument } from '@/shared/api/gql/graphql'
import { ContentArticle } from './ContentArticle'

function StatusMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <p className="mb-4 text-xs font-bold tracking-[0.22em] text-hub-accent uppercase">
        Content Hub
      </p>
      <h1 className="font-hub-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-xl text-lg text-hub-muted">{message}</p>
      <Link
        to="/"
        className="mt-8 inline-block font-semibold text-hub-accent underline underline-offset-4"
      >
        Back to home
      </Link>
    </div>
  )
}

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
  return <ContentArticle content={content} />
}
