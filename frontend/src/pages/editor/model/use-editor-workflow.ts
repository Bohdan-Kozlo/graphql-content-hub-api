import { useState } from 'react'
import { useApolloClient, useMutation } from '@apollo/client/react'
import { useNavigate } from 'react-router'
import {
  CreateEditorDraftDocument,
  RemoveEditorContentDocument,
  UpdateEditorDraftDocument,
} from '@/shared/api/gql/graphql'
import type { ContentType } from '@/shared/api/gql/graphql'
import { mediaDraftError, mediaDraftFields } from './media-draft'
import { invalidateEditorContent } from './editor-workflow'

type EditorValues = {
  title: string
  description: string
  categoryId: string
  tagIds: string[]
  sourceId: string
  body: string
  bodyChanged: boolean
  mediaUrl: string
  thumbnail: string
  duration: string
  type: ContentType
}

export function useEditorWorkflow() {
  const client = useApolloClient()
  const navigate = useNavigate()
  const [create, creating] = useMutation(CreateEditorDraftDocument)
  const [update, updating] = useMutation(UpdateEditorDraftDocument)
  const [remove, removing] = useMutation(RemoveEditorContentDocument)
  const [error, setError] = useState('')

  async function save(id: string | undefined, values: EditorValues) {
    setError('')
    if (!values.title.trim() || !values.description.trim() || !values.categoryId) {
      setError('Complete the title, description, and category.')
      return
    }
    const isMedia = values.type === 'VIDEO' || values.type === 'PODCAST'
    const invalidMedia = isMedia
      ? mediaDraftError(values.mediaUrl, values.thumbnail, values.duration)
      : null
    if (invalidMedia) {
      setError(invalidMedia)
      return
    }
    const mediaFields = isMedia
      ? mediaDraftFields(values.mediaUrl, values.thumbnail, values.duration)
      : {}
    try {
      if (id) {
        await update({
          variables: {
            id,
            data: {
              title: values.title.trim(),
              description: values.description.trim(),
              categoryId: values.categoryId,
              tagIds: values.tagIds,
              sourceId: values.sourceId || null,
              ...mediaFields,
              ...(!isMedia && values.bodyChanged ? { body: values.body } : {}),
            },
          },
        })
        invalidateEditorContent(client, id)
        navigate('/editor')
      } else {
        const result = await create({
          variables: {
            data: {
              title: values.title.trim(),
              description: values.description.trim(),
              categoryId: values.categoryId,
              type: values.type,
              ...(!isMedia ? { body: values.body } : {}),
              tagIds: values.tagIds,
              sourceId: values.sourceId || undefined,
              ...mediaFields,
            },
          },
        })
        navigate(`/editor/${result.data?.createContent.id}`)
      }
    } catch {
      setError('Unable to save this content. Please try again.')
    }
  }

  async function deleteContent(id: string | undefined, title: string | undefined) {
    if (
      !id ||
      !window.confirm(
        `Delete “${title ?? 'this content'}” permanently? This also removes its comments, reactions, views, and bookmarks.`,
      )
    )
      return
    setError('')
    try {
      await remove({ variables: { id } })
      invalidateEditorContent(client, id)
      navigate('/editor')
    } catch {
      setError('Unable to delete this content. Please try again.')
    }
  }

  return {
    save,
    deleteContent,
    error,
    saving: creating.loading || updating.loading,
    removing: removing.loading,
  }
}
