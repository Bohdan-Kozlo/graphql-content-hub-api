import { expect, test } from '@playwright/test'

const account = {
  id: 'reader-1',
  email: 'reader@example.com',
  username: 'reader',
  roles: ['USER'],
}
const story = {
  __typename: 'ContentModel',
  id: 'story-1',
  title: 'A reaction-ready story',
  description: 'A story readers can save.',
  type: 'ARTICLE',
  status: 'PUBLISHED',
  thumbnail: null,
  publishedAt: '2026-10-23T12:00:00.000Z',
  author: { id: 'author-1', username: 'Author' },
  category: { name: 'Culture' },
  likeCount: 0,
  viewCount: 7,
  liked: false,
  saved: false,
}

test('guest is directed to sign in before reacting', async ({ page }) => {
  await page.route('**/graphql', async (route) => {
    const { query } = route.request().postDataJSON() as { query: string }
    if (query.includes('refreshTokens')) {
      return route.fulfill({
        json: {
          errors: [{ message: 'Unauthorized', extensions: { code: 'UNAUTHENTICATED' } }],
        },
      })
    }
    if (query.includes('DiscoveryFilters'))
      return route.fulfill({ json: { data: { categories: [], tags: [] } } })
    return route.fulfill({
      json: {
        data: {
          publishedContents: { items: [story], endCursor: 'story-1', hasMore: false },
        },
      },
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Like' }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test('reader can like and save a catalog story, then open Saved', async ({ page }) => {
  let state = { liked: false, saved: false, likeCount: 0 }
  await page.route('**/graphql', async (route) => {
    const { query, variables } = route.request().postDataJSON() as {
      query: string
      variables?: Record<string, unknown>
    }
    if (query.includes('refreshTokens'))
      return route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'access-token', account } } },
      })
    if (query.includes('CreateView'))
      return route.fulfill({ json: { data: { createView: { id: 'view-1' } } } })
    if (query.includes('DiscoveryFilters'))
      return route.fulfill({ json: { data: { categories: [], tags: [] } } })
    if (query.includes('toggleContentReaction')) {
      const type = (variables?.data as { type?: string } | undefined)?.type
      if (type === 'LIKE') {
        state = { ...state, liked: !state.liked, likeCount: state.liked ? 0 : 1 }
      } else state = { ...state, saved: !state.saved }
      return route.fulfill({
        json: {
          data: {
            toggleContentReaction: {
              __typename: 'ContentReactionStateModel',
              contentId: story.id,
              ...state,
            },
          },
        },
      })
    }
    if (query.includes('SavedContents')) {
      return route.fulfill({
        json: {
          data: {
            savedContents: {
              items: [{ ...story, ...state }],
              endCursor: 'story-1',
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
            items: [{ ...story, ...state }],
            endCursor: 'story-1',
            hasMore: false,
          },
        },
      },
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Like' }).click()
  await expect(page.getByRole('button', { name: 'Unlike' })).toBeVisible()
  await expect(page.getByText('1 like')).toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('button', { name: 'Remove bookmark' })).toBeVisible()
  await page.getByRole('link', { name: 'Saved' }).click()
  await expect(page.getByRole('heading', { name: 'Saved stories' })).toBeVisible()
  await expect(page.getByRole('heading', { name: story.title })).toBeVisible()
  await expect(page.getByText('7 views')).toBeVisible()
})

test('reader can react on the content page', async ({ page }) => {
  let state = { liked: false, saved: false, likeCount: 0 }
  await page.route('**/graphql', async (route) => {
    const { query, variables } = route.request().postDataJSON() as {
      query: string
      variables?: Record<string, unknown>
    }
    if (query.includes('refreshTokens')) {
      return route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'access-token', account } } },
      })
    }
    if (query.includes('CreateView')) {
      return route.fulfill({ json: { data: { createView: { id: 'view-1' } } } })
    }
    if (query.includes('FollowedTopics')) {
      return route.fulfill({
        json: { data: { myFollowedCategories: [], myFollowedSources: [] } },
      })
    }
    if (query.includes('toggleContentReaction')) {
      const type = (variables?.data as { type?: string } | undefined)?.type
      state =
        type === 'LIKE'
          ? { ...state, liked: !state.liked, likeCount: state.liked ? 0 : 1 }
          : { ...state, saved: !state.saved }
      return route.fulfill({
        json: {
          data: {
            toggleContentReaction: {
              __typename: 'ContentReactionStateModel',
              contentId: story.id,
              ...state,
            },
          },
        },
      })
    }
    return route.fulfill({
      json: {
        data: {
          content: {
            ...story,
            ...state,
            body: 'A readable story body.',
            mediaUrl: null,
            author: { ...story.author, bio: null, avatarUrl: null },
            category: { id: 'category-1', name: 'Culture' },
            tags: [],
            source: null,
          },
        },
      },
    })
  })

  await page.goto(`/content/${story.id}`)
  await page.getByRole('button', { name: 'Like' }).click()
  await expect(page.getByRole('button', { name: 'Unlike' })).toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('button', { name: 'Remove bookmark' })).toBeVisible()
})
