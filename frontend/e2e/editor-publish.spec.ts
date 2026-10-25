import { expect, test } from '@playwright/test'

test('editor publishes a saved draft, sees errors, and opens it from the catalog', async ({
  page,
}) => {
  const account = {
    id: 'editor-1',
    email: 'editor@example.test',
    username: 'Mira',
    roles: ['EDITOR'],
    hasPassword: true,
  }
  const body = JSON.stringify({
    version: 1,
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bright stars' }] }],
  })
  const story = {
    id: 'draft-1',
    title: 'Mapping the sky',
    description: 'A short guide to stars',
    type: 'ARTICLE',
    body,
    status: 'DRAFT',
    publishedAt: null as string | null,
    thumbnail: null,
    mediaUrl: null,
    category: { id: 'science', name: 'Science' },
    tags: [],
    source: null,
    author: { id: 'editor-1', username: 'Mira', bio: null, avatarUrl: null },
    likeCount: 0,
    viewCount: 0,
    liked: false,
    saved: false,
  }
  let attempts = 0
  await page.route('**/graphql', async (route) => {
    const { query } = route.request().postDataJSON() as { query: string }
    if (query.includes('refreshTokens'))
      return route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'editor-token', account } } },
      })
    if (query.includes('MyDrafts'))
      return route.fulfill({
        json: { data: { myDrafts: story.status === 'DRAFT' ? [story] : [] } },
      })
    if (query.includes('MyPublishedContents'))
      return route.fulfill({
        json: {
          data: { myPublishedContents: story.status === 'PUBLISHED' ? [story] : [] },
        },
      })
    if (query.includes('PublishEditorDraft')) {
      attempts++
      if (attempts === 1)
        return route.fulfill({ json: { errors: [{ message: 'Publish failed' }] } })
      story.status = 'PUBLISHED'
      story.publishedAt = '2026-10-25T10:00:00.000Z'
      return route.fulfill({ json: { data: { publishContent: story } } })
    }
    if (query.includes('PublicCatalog'))
      return route.fulfill({
        json: {
          data: {
            publishedContents: {
              items: story.status === 'PUBLISHED' ? [story] : [],
              endCursor: story.status === 'PUBLISHED' ? story.id : null,
              hasMore: false,
            },
          },
        },
      })
    if (query.includes('PublicContent'))
      return route.fulfill({ json: { data: { content: story } } })
    if (query.includes('FollowedTopics'))
      return route.fulfill({
        json: { data: { myFollowedCategories: [], myFollowedSources: [] } },
      })
    if (query.includes('ContentComments'))
      return route.fulfill({ json: { data: { commentsByContent: [] } } })
    if (query.includes('CreateView'))
      return route.fulfill({ json: { data: { createView: { id: 'view-1' } } } })
    if (query.includes('DiscoveryFilters'))
      return route.fulfill({ json: { data: { categories: [], tags: [] } } })
    return route.fulfill({ json: { data: {} } })
  })

  await page.goto('/editor')
  await expect(page.getByRole('heading', { name: 'Your drafts' })).toBeVisible()
  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(page.getByRole('alert')).toContainText('Unable to publish this draft')
  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'is published' }),
  ).toContainText('Mapping the sky is published')
  await page.getByRole('link', { name: 'View published story' }).click()
  await expect(page).toHaveURL(/\/content\/draft-1$/)
  await expect(page.getByRole('heading', { name: 'Mapping the sky' })).toBeVisible()
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Mapping the sky/ })).toBeVisible()
})
