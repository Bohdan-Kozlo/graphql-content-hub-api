import { expect, test } from '@playwright/test'

const catalogItems = [
  {
    id: 'article-1',
    title: 'Fresh Ideas',
    type: 'ARTICLE',
    description: 'An article about fresh ideas',
  },
  {
    id: 'video-1',
    title: 'City in Motion',
    type: 'VIDEO',
    description: 'A short city film',
  },
  {
    id: 'podcast-1',
    title: 'The Listening Room',
    type: 'PODCAST',
    description: 'An audio conversation',
  },
  {
    id: 'news-1',
    title: 'Today in Science',
    type: 'NEWS',
    description: 'A science update',
  },
].map((item) => ({
  ...item,
  status: 'PUBLISHED',
  publishedAt: '2026-01-15T12:00:00.000Z',
  thumbnail: null,
  likeCount: 0,
  viewCount: 12,
  liked: false,
  saved: false,
  author: { id: 'author-1', username: 'Alex Writer' },
  category: { id: 'category-1', name: 'Culture' },
}))

test('loads all four types in pages and opens a story', async ({ page }) => {
  const cursors: Array<string | null> = []
  let recordedViews = 0
  await page.route('**/graphql', async (route) => {
    const body = route.request().postDataJSON() as {
      operationName?: string
      variables?: { after?: string | null }
    }
    if (body.operationName === 'PublicCatalog') {
      const after = body.variables?.after ?? null
      cursors.push(after)
      const second = after === 'video-1'
      await route.fulfill({
        json: {
          data: {
            publishedContents: {
              items: second
                ? [catalogItems[1], ...catalogItems.slice(2)]
                : catalogItems.slice(0, 2),
              endCursor: second ? 'news-1' : 'video-1',
              hasMore: !second,
            },
          },
        },
      })
      return
    }
    if (body.operationName === 'DiscoveryFilters') {
      await route.fulfill({ json: { data: { categories: [], tags: [] } } })
      return
    }
    if (body.operationName === 'PublicContent') {
      await route.fulfill({
        json: {
          data: {
            content: {
              ...catalogItems[2],
              viewCount: 12 + recordedViews,
              status: 'PUBLISHED',
              body: 'Listen to a thoughtful conversation.',
              mediaUrl: null,
              tags: [],
              source: null,
              author: {
                id: 'author-1',
                username: 'Alex Writer',
                bio: null,
                avatarUrl: null,
              },
              category: { id: 'category-1', name: 'Culture' },
            },
          },
        },
      })
      return
    }
    if (body.operationName === 'CreateView') {
      recordedViews += 1
      await route.fulfill({ json: { data: { createView: { id: 'view-1' } } } })
    }
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Fresh Ideas' })).toBeVisible()
  await expect(
    page.getByRole('article').filter({ hasText: 'Fresh Ideas' }).getByText('12 views'),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'City in Motion' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'The Listening Room' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Load more' }).click()
  await expect(page.getByRole('heading', { name: 'The Listening Room' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Today in Science' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'City in Motion' })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0)
  expect(cursors).toEqual([null, 'video-1'])

  await page.getByRole('link', { name: /The Listening Room/ }).click()
  await expect(page).toHaveURL(/\/content\/podcast-1$/)
  await expect(page.getByText('Listen to a thoughtful conversation.')).toBeVisible()
  await expect(page.getByText('13 views')).toBeVisible()
})

test('shows an empty catalog when there are no published items', async ({ page }) => {
  await page.route('**/graphql', (route) => {
    const body = route.request().postDataJSON() as { operationName?: string }
    return route.fulfill({
      json: {
        data:
          body.operationName === 'DiscoveryFilters'
            ? { categories: [], tags: [] }
            : {
                publishedContents: {
                  items: [],
                  endCursor: null,
                  hasMore: false,
                },
              },
      },
    })
  })
  await page.goto('/')
  await expect(page.getByText('No stories published yet.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0)
})

test('keeps the current page and offers a retry when Load more fails', async ({
  page,
}) => {
  let attempts = 0
  await page.route('**/graphql', (route) => {
    const body = route.request().postDataJSON() as {
      operationName?: string
      variables?: { after?: string }
    }
    if (body.operationName === 'DiscoveryFilters') {
      return route.fulfill({ json: { data: { categories: [], tags: [] } } })
    }
    if (body.variables?.after) {
      attempts += 1
      if (attempts === 1) return route.abort()
      return route.fulfill({
        json: {
          data: {
            publishedContents: {
              items: catalogItems.slice(2),
              endCursor: 'news-1',
              hasMore: false,
            },
          },
        },
      })
    }
    return route.fulfill({
      json: {
        data: {
          publishedContents: {
            items: catalogItems.slice(0, 2),
            endCursor: 'video-1',
            hasMore: true,
          },
        },
      },
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Load more' }).click()
  await expect(page.getByText('Could not load more stories.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fresh Ideas' })).toBeVisible()
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { name: 'Today in Science' })).toBeVisible()
  expect(attempts).toBe(2)
})

test('combines search, type, category and tag and clears the filtered view', async ({
  page,
}) => {
  const requests: Array<Record<string, unknown>> = []
  await page.route('**/graphql', (route) => {
    const body = route.request().postDataJSON() as {
      operationName?: string
      variables?: Record<string, unknown>
    }
    if (body.operationName === 'DiscoveryFilters') {
      return route.fulfill({
        json: {
          data: {
            categories: [
              { id: 'category-1', name: 'Culture', parent: null },
              { id: 'category-2', name: 'Music', parent: { id: 'category-1' } },
            ],
            tags: [{ id: 'tag-1', name: 'Audio' }],
          },
        },
      })
    }
    requests.push(body.variables ?? {})
    const filtered =
      body.variables?.search === 'city' &&
      body.variables?.type === 'VIDEO' &&
      body.variables?.categoryId === 'category-2' &&
      body.variables?.tagId === 'tag-1'
    const noMatch = body.variables?.search === 'absent'
    return route.fulfill({
      json: {
        data: {
          publishedContents: {
            items: noMatch
              ? []
              : filtered
                ? [
                    catalogItems[1],
                    {
                      ...catalogItems[0],
                      id: 'draft-1',
                      title: 'Secret draft',
                      status: 'DRAFT',
                    },
                  ]
                : catalogItems.slice(0, 2),
            endCursor: filtered ? 'video-1' : 'video-1',
            hasMore: false,
          },
        },
      },
    })
  })

  await page.goto('/')
  await page.getByRole('searchbox', { name: 'Search stories' }).fill('city')
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByLabel('Content type').selectOption('VIDEO')
  await page.getByLabel('Category').selectOption('category-2')
  await page.getByLabel('Tag').selectOption('tag-1')
  await expect(page.getByRole('heading', { name: 'City in Motion' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fresh Ideas' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Secret draft' })).toHaveCount(0)
  await expect(page.getByText('Category: Music')).toBeVisible()
  expect(requests).toContainEqual(
    expect.objectContaining({
      search: 'city',
      type: 'VIDEO',
      categoryId: 'category-2',
      tagId: 'tag-1',
      first: 12,
      after: null,
    }),
  )
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page).toHaveURL('http://127.0.0.1:5173/')
  await expect(page.getByRole('heading', { name: 'Fresh Ideas' })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search stories' }).fill('absent')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page.getByText('No stories match these filters.')).toBeVisible()
})
