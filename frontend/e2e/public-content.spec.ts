import { expect, test } from '@playwright/test'

const publicContent = {
  id: 'story-123',
  title: 'Mapping the Night Sky',
  description: 'A beginner guide to the stars',
  body: 'Look up after sunset.\nFind the brightest star.',
  mediaUrl: null,
  thumbnail: null,
  type: 'ARTICLE',
  status: 'PUBLISHED',
  publishedAt: '2026-01-15T12:00:00.000Z',
  author: {
    id: 'author-1',
    username: 'Alex Writer',
    bio: 'Science writer',
    avatarUrl: null,
  },
  category: { id: 'category-1', name: 'Science' },
  tags: [{ id: 'tag-1', name: 'Astronomy' }],
  source: { id: 'source-1', name: 'Open Journal', url: 'https://example.org' },
}

test('opens a published story from its stable URL', async ({ page }) => {
  await page.route('**/graphql', async (route) => {
    const request = route.request().postDataJSON() as {
      operationName?: string
      variables?: { id?: string; authorId?: string }
    }
    if (request.operationName === 'DiscoveryFilters') {
      await route.fulfill({ json: { data: { categories: [], tags: [] } } })
    } else if (request.operationName === 'PublicCatalog') {
      expect(request.variables?.authorId).toBe('author-1')
      await route.fulfill({
        json: {
          data: {
            publishedContents: {
              items: [publicContent],
              endCursor: 'story-123',
              hasMore: false,
            },
          },
        },
      })
    } else {
      expect(request.variables?.id).toBe('story-123')
      await route.fulfill({ json: { data: { content: publicContent } } })
    }
  })

  await page.goto('/content/story-123')
  await expect(
    page.getByRole('heading', { name: 'Mapping the Night Sky' }),
  ).toBeVisible()
  await expect(page.getByText('Look up after sunset.')).toBeVisible()
  await expect(page.getByText('Alex Writer')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Alex Writer' })).toHaveAttribute(
    'href',
    '/?authorId=author-1',
  )
  await expect(page.getByText('Science')).toBeVisible()
  await expect(page.getByText('Astronomy')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Science' })).toHaveAttribute(
    'href',
    '/?categoryId=category-1',
  )
  await expect(page.getByRole('link', { name: 'Astronomy' })).toHaveAttribute(
    'href',
    '/?tagId=tag-1',
  )
  await expect(
    page.getByRole('link', { name: 'Open Journal' }),
  ).toHaveAttribute('href', 'https://example.org/')
  await expect(page.getByText(/example\.test/)).toHaveCount(0)
  await page.getByRole('link', { name: 'Alex Writer' }).click()
  await expect(page).toHaveURL(/\?authorId=author-1$/)
  await expect(
    page.getByRole('heading', { name: 'Mapping the Night Sky' }),
  ).toBeVisible()
})

test('does not display a draft on its public URL', async ({ page }) => {
  await page.route('**/graphql', (route) =>
    route.fulfill({ json: { data: { content: null } } }),
  )
  await page.goto('/content/draft-456')
  await expect(
    page.getByRole('heading', { name: 'Content unavailable' }),
  ).toBeVisible()
})
