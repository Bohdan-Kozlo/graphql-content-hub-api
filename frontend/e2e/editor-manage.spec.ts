import { expect, test } from '@playwright/test'

test('editor corrects a published story and deletes it only after confirmation', async ({
  page,
}) => {
  const account = {
    id: 'editor-1',
    email: 'editor@example.test',
    username: 'Mira',
    roles: ['EDITOR'],
    hasPassword: true,
  }
  const firstPublishedAt = '2020-01-01T00:00:00.000Z'
  const story = {
    id: 'story-1',
    title: 'Original title',
    description: 'Original summary',
    type: 'ARTICLE',
    body: JSON.stringify({
      version: 1,
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Original text' }] },
      ],
    }),
    status: 'PUBLISHED',
    publishedAt: firstPublishedAt,
    category: { id: 'science', name: 'Science' },
    tags: [],
    source: null,
    mediaUrl: null,
    thumbnail: null,
    duration: null,
    author: { id: 'editor-1', username: 'Mira', bio: null, avatarUrl: null },
    likeCount: 0,
    viewCount: 0,
    liked: false,
    saved: false,
  }
  let deleted = false
  let lastUpdate: Record<string, unknown> | undefined
  await page.route('**/graphql', async (route) => {
    const { query, variables } = route.request().postDataJSON() as {
      query: string
      variables?: { data?: Record<string, unknown> }
    }
    if (query.includes('refreshTokens'))
      return route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'editor-token', account } } },
      })
    if (query.includes('MyDrafts'))
      return route.fulfill({ json: { data: { myDrafts: [] } } })
    if (query.includes('MyPublishedContents'))
      return route.fulfill({
        json: { data: { myPublishedContents: deleted ? [] : [story] } },
      })
    if (query.includes('MyContent('))
      return route.fulfill({ json: { data: { myContent: deleted ? null : story } } })
    if (query.includes('EditorMetadataOptions'))
      return route.fulfill({
        json: {
          data: {
            categories: [{ id: 'science', name: 'Science' }],
            tags: [],
            sources: [],
          },
        },
      })
    if (query.includes('UpdateEditorDraft')) {
      lastUpdate = variables?.data
      Object.assign(story, {
        title: lastUpdate?.title,
        description: lastUpdate?.description,
        body: lastUpdate?.body,
      })
      return route.fulfill({ json: { data: { updateContent: { id: story.id } } } })
    }
    if (query.includes('RemoveEditorContent')) {
      deleted = true
      return route.fulfill({ json: { data: { removeContent: true } } })
    }
    if (query.includes('PublicContent'))
      return route.fulfill({ json: { data: { content: deleted ? null : story } } })
    if (query.includes('ContentComments'))
      return route.fulfill({ json: { data: { commentsByContent: [] } } })
    if (query.includes('CreateView'))
      return route.fulfill({ json: { data: { createView: { id: 'view-1' } } } })
    if (query.includes('FollowedTopics'))
      return route.fulfill({
        json: { data: { myFollowedCategories: [], myFollowedSources: [] } },
      })
    return route.fulfill({ json: { data: {} } })
  })
  await page.goto('/editor')
  await expect(page.getByRole('heading', { name: 'Your content' })).toBeVisible()
  await page.getByRole('link', { name: 'Edit published story' }).click()
  await expect(page.getByRole('heading', { name: 'Edit article' })).toBeVisible()
  await page.getByLabel('Title').fill('Corrected title')
  await page.getByRole('textbox', { name: 'Article text' }).fill('Corrected text')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page).toHaveURL(/\/editor$/)
  expect(lastUpdate).toMatchObject({ title: 'Corrected title' })
  expect(story.publishedAt).toBe(firstPublishedAt)
  await page.goto('/content/story-1')
  await expect(page.getByRole('heading', { name: 'Corrected title' })).toBeVisible()
  await expect(page.getByText('Corrected text')).toBeVisible()
  await page.goto('/editor')
  await page.getByRole('link', { name: 'Edit published story' }).click()
  page.once('dialog', (dialog) => void dialog.dismiss())
  await page.getByRole('button', { name: 'Delete content' }).click()
  expect(deleted).toBe(false)
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: 'Delete content' }).click()
  await expect(page).toHaveURL(/\/editor$/)
  await expect(page.getByText('Corrected title')).toHaveCount(0)
  expect(deleted).toBe(true)
})
