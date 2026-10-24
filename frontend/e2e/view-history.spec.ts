import { expect, test } from '@playwright/test'

const account = {
  id: 'reader-1',
  email: 'reader@example.com',
  username: 'reader',
  roles: ['USER'],
}

const story = {
  id: 'story-1',
  title: 'A remembered story',
  description: 'A story the reader opened.',
  body: 'A readable story body.',
  mediaUrl: null,
  thumbnail: null,
  type: 'ARTICLE',
  status: 'PUBLISHED',
  publishedAt: '2026-10-24T12:00:00.000Z',
  likeCount: 0,
  viewCount: 0,
  liked: false,
  saved: false,
  author: { id: 'author-1', username: 'Author', bio: null, avatarUrl: null },
  category: { id: 'category-1', name: 'Culture' },
  tags: [],
  source: null,
}

test('records an opened story once and shows it in the reader history', async ({
  page,
}) => {
  let viewRequests = 0
  await page.route('**/graphql', async (route) => {
    const { query } = route.request().postDataJSON() as { query: string }
    if (query.includes('refreshTokens')) {
      return route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'access-token', account } } },
      })
    }
    if (query.includes('CreateView')) {
      viewRequests += 1
      return route.fulfill({ json: { data: { createView: { id: 'view-1' } } } })
    }
    if (query.includes('ViewHistory')) {
      return route.fulfill({
        json: {
          data: {
            myViewHistory: {
              items: viewRequests ? [{ ...story, viewCount: viewRequests }] : [],
              endCursor: null,
              hasMore: false,
            },
          },
        },
      })
    }
    return route.fulfill({
      json: { data: { content: { ...story, viewCount: viewRequests } } },
    })
  })

  await page.goto(`/content/${story.id}`)
  await expect(page.getByRole('heading', { name: story.title })).toBeVisible()
  await expect.poll(() => viewRequests).toBe(1)
  await expect(page.getByText('1 view')).toBeVisible()

  await page.getByRole('link', { name: 'History' }).click()
  await expect(page).toHaveURL(/\/history$/)
  await expect(page.getByRole('heading', { name: 'Reading history' })).toBeVisible()
  await expect(page.getByRole('link', { name: story.title })).toHaveAttribute(
    'href',
    `/content/${story.id}`,
  )
  await expect(page.getByText('1 view')).toBeVisible()
})
