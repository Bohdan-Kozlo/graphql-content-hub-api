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
    if (query.includes('EditorCategories'))
      return route.fulfill({
        json: { data: { categories: [{ id: 'science', name: 'Science' }] } },
      })
    if (query.includes('CreateArticleDraft')) {
      saved = {
        id: 'draft-1',
        title: variables!.data!.title,
        description: variables!.data!.description,
        body: variables!.data!.body,
        type: 'ARTICLE',
        status: 'DRAFT',
        category: { id: 'science', name: 'Science' },
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
