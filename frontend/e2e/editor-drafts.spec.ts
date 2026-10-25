import { expect, test } from '@playwright/test'

test('editor creates and reopens a formatted article draft', async ({ page }) => {
  const account = {
    id: 'editor-1',
    email: 'editor@example.test',
    username: 'Mira',
    roles: ['EDITOR'],
    hasPassword: true,
  }
  let saved: {
    id: string
    title: string
    description: string
    type: string
    status: string
    body: string
    category: { id: string; name: string }
    tags: { id: string; name: string }[]
    source: { id: string; name: string } | null
    mediaUrl: string | null
    thumbnail: string | null
    duration: number | null
  } | null = null
  await page.route('**/graphql', async (route) => {
    const { query, variables } = route.request().postDataJSON() as {
      query: string
      variables?: {
        id?: string
        data?: { title: string; description: string; body: string; categoryId: string }
      }
    }
    if (query.includes('refreshTokens'))
      return route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'editor-token', account } } },
      })
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
    if (query.includes('CreateEditorDraft')) {
      saved = {
        id: 'draft-1',
        title: variables!.data!.title,
        description: variables!.data!.description,
        body: variables!.data!.body,
        type: 'ARTICLE',
        status: 'DRAFT',
        category: { id: 'science', name: 'Science' },
        tags: [],
        source: null,
        mediaUrl: null,
        thumbnail: null,
        duration: null,
      }
      return route.fulfill({ json: { data: { createContent: { id: 'draft-1' } } } })
    }
    if (query.includes('MyDrafts'))
      return route.fulfill({ json: { data: { myDrafts: saved ? [saved] : [] } } })
    if (query.includes('MyDraft('))
      return route.fulfill({ json: { data: { myDraft: saved } } })
    return route.fulfill({ json: { data: {} } })
  })
  await page.goto('/editor')
  await expect(page.getByRole('heading', { name: 'Your drafts' })).toBeVisible()
  await page.getByRole('link', { name: 'New article' }).click()
  await page.getByLabel('Title').fill('Mapping the sky')
  await page.getByLabel('Description').fill('A short guide to stars')
  await page.getByLabel('Primary category').selectOption('science')
  await page.getByRole('textbox', { name: 'Article text' }).fill('Bright stars')
  await page.getByRole('textbox', { name: 'Article text' }).selectText()
  await page.getByRole('button', { name: 'Bold' }).click()
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page).toHaveURL(/\/editor\/draft-1$/)
  await page.getByRole('button', { name: 'Preview' }).click()
  await expect(page.getByLabel('Article preview').locator('strong')).toHaveText(
    'Bright stars',
  )
  await page.getByRole('link', { name: 'Your drafts' }).click()
  await expect(page.getByText('Mapping the sky')).toBeVisible()
  await page.getByRole('link', { name: 'Open draft' }).click()
  await page.getByRole('button', { name: 'Preview' }).click()
  await expect(page.getByLabel('Article preview').locator('strong')).toHaveText(
    'Bright stars',
  )
})

test('editor creates news with tags and source, then changes its saved metadata', async ({
  page,
}) => {
  const account = {
    id: 'editor-1',
    email: 'editor@example.test',
    username: 'Mira',
    roles: ['EDITOR'],
    hasPassword: true,
  }
  const tags = [
    { id: 'space', name: 'Space' },
    { id: 'research', name: 'Research' },
  ]
  const sources = [{ id: 'journal', name: 'Science Journal' }]
  let saved: Record<string, unknown> | null = null
  let lastInput: Record<string, unknown> | null = null
  await page.route('**/graphql', async (route) => {
    const { query, variables } = route.request().postDataJSON() as {
      query: string
      variables?: { data?: Record<string, unknown> }
    }
    if (query.includes('refreshTokens'))
      return route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'editor-token', account } } },
      })
    if (query.includes('EditorMetadataOptions'))
      return route.fulfill({
        json: {
          data: { categories: [{ id: 'science', name: 'Science' }], tags, sources },
        },
      })
    if (query.includes('CreateEditorDraft')) {
      lastInput = variables!.data!
      saved = {
        id: 'news-1',
        ...lastInput,
        status: 'DRAFT',
        category: { id: 'science', name: 'Science' },
        tags,
        source: sources[0],
        mediaUrl: null,
        thumbnail: null,
        duration: null,
      }
      return route.fulfill({ json: { data: { createContent: { id: 'news-1' } } } })
    }
    if (query.includes('UpdateEditorDraft')) {
      lastInput = variables!.data!
      saved = { ...saved, tags: [tags[1]], source: null }
      return route.fulfill({ json: { data: { updateContent: { id: 'news-1' } } } })
    }
    if (query.includes('MyDraft('))
      return route.fulfill({ json: { data: { myDraft: saved } } })
    if (query.includes('MyDrafts'))
      return route.fulfill({ json: { data: { myDrafts: saved ? [saved] : [] } } })
    return route.fulfill({ json: { data: {} } })
  })
  await page.goto('/editor')
  await expect(page.getByRole('heading', { name: 'Your drafts' })).toBeVisible()
  await page.getByRole('link', { name: 'New news' }).click()
  await expect(page.getByRole('heading', { name: 'New news' })).toBeVisible()
  await page.getByLabel('Title').fill('Telescope launch')
  await page.getByLabel('Description').fill('A new telescope reaches orbit')
  await page.getByLabel('Primary category').selectOption('science')
  await page.getByLabel('Space').check()
  await page.getByLabel('Research').check()
  await page.getByLabel('Source (optional)').selectOption('journal')
  await page.getByRole('textbox', { name: 'News text' }).fill('Launch succeeded')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page).toHaveURL(/\/editor\/news-1$/)
  expect(lastInput).toMatchObject({
    type: 'NEWS',
    tagIds: ['space', 'research'],
    sourceId: 'journal',
  })
  await page.getByRole('button', { name: 'Preview' }).click()
  await expect(page.getByLabel('News preview')).toContainText('Tags: Space, Research')
  await expect(page.getByLabel('News preview')).toContainText('Source: Science Journal')
  await page.getByRole('button', { name: 'Edit text' }).click()
  await page.getByLabel('Space').uncheck()
  await page.getByLabel('Source (optional)').selectOption('')
  await page.getByRole('button', { name: 'Save draft' }).click()
  expect(lastInput).toMatchObject({ tagIds: ['research'], sourceId: null })
  await page.getByRole('link', { name: 'Open draft' }).click()
  await page.getByRole('button', { name: 'Preview' }).click()
  await expect(page.getByLabel('News preview')).toContainText('Tags: Research')
  await expect(page.getByLabel('News preview')).toContainText('Source: None')
})
