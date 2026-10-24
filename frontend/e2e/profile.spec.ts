import { expect, test } from '@playwright/test'

const author = {
  id: 'author-1',
  username: 'Alex Writer',
  bio: 'Science writer',
  avatarUrl: null,
}
const story = {
  id: 'story-1',
  title: 'Mapping the Night Sky',
  description: 'A guide to stars',
  type: 'ARTICLE',
  status: 'PUBLISHED',
  thumbnail: null,
  likeCount: 0,
  liked: false,
  saved: false,
  publishedAt: '2026-01-15T12:00:00.000Z',
  author,
  category: null,
}

test('visitor follows an author to a public profile and its published stories', async ({
  page,
}) => {
  await page.route('**/graphql', async (route) => {
    const { query, variables } = route.request().postDataJSON() as {
      query: string
      variables?: { id?: string }
    }
    if (query.includes('refreshTokens')) {
      await route.fulfill({ json: { errors: [{ message: 'Unauthorized' }] } })
    } else if (query.includes('PublicProfile')) {
      expect(variables?.id).toBe(author.id)
      await route.fulfill({ json: { data: { publicProfile: author } } })
    } else if (query.includes('publishedContents')) {
      await route.fulfill({
        json: {
          data: {
            publishedContents: { items: [story], endCursor: story.id, hasMore: false },
            categories: [],
            tags: [],
          },
        },
      })
    } else {
      await route.fulfill({ json: { data: { categories: [], tags: [] } } })
    }
  })
  await page.goto('/')
  await page.getByRole('link', { name: 'Alex Writer' }).click()
  await expect(page).toHaveURL('/users/author-1')
  await expect(page.getByRole('heading', { name: 'Alex Writer' })).toBeVisible()
  await expect(
    page.getByRole('img', { name: 'Default avatar for Alex Writer' }),
  ).toBeVisible()
  await expect(page.getByText('Science writer')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Read Mapping the Night Sky' }),
  ).toBeVisible()
  await expect(page.getByText('reader@example.com')).toHaveCount(0)
})

test('owner edits allowed fields and sees the name update immediately', async ({
  page,
}) => {
  const account = {
    id: 'reader-1',
    email: 'reader@example.com',
    username: 'Reader',
    roles: ['USER'],
  }
  let profile = {
    id: account.id,
    username: account.username,
    bio: null as string | null,
    avatarUrl: null as string | null,
  }
  await page.route('**/graphql', async (route) => {
    const { query, variables } = route.request().postDataJSON() as {
      query: string
      variables?: { data?: typeof profile }
    }
    if (query.includes('refreshTokens')) {
      await route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'token', account } } },
      })
    } else if (query.includes('updateProfile')) {
      profile = {
        ...profile,
        ...variables?.data,
        bio: variables?.data?.bio || null,
        avatarUrl: variables?.data?.avatarUrl || null,
      }
      await route.fulfill({ json: { data: { updateProfile: profile } } })
    } else if (query.includes('PublicProfile')) {
      await route.fulfill({ json: { data: { publicProfile: profile } } })
    } else if (query.includes('publishedContents')) {
      await route.fulfill({
        json: {
          data: { publishedContents: { items: [], endCursor: null, hasMore: false } },
        },
      })
    } else {
      await route.fulfill({ json: { data: {} } })
    }
  })
  await page.goto('/account')
  await page.getByLabel('Username').fill('Updated Reader')
  await page.getByLabel('Biography').fill('New bio')
  await page.getByLabel('Avatar URL').fill('https://images.example.test/avatar.png')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByRole('status').getByText('Profile saved.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Updated Reader' })).toBeVisible()
  await page.getByRole('link', { name: 'View public profile' }).click()
  await expect(page.getByRole('heading', { name: 'Updated Reader' })).toBeVisible()
  await expect(page.getByText('New bio')).toBeVisible()
  await page.getByRole('link', { name: 'Edit profile' }).click()
  await page.getByLabel('Biography').fill('')
  await page.getByLabel('Avatar URL').fill('')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await page.getByRole('link', { name: 'View public profile' }).click()
  await expect(page.getByText('New bio')).toHaveCount(0)
  await expect(
    page.getByRole('img', { name: 'Default avatar for Updated Reader' }),
  ).toBeVisible()
})

test('unknown profile has a clear empty state', async ({ page }) => {
  await page.route('**/graphql', async (route) => {
    const { query } = route.request().postDataJSON() as { query: string }
    await route.fulfill({
      json: query.includes('PublicProfile')
        ? { data: { publicProfile: null } }
        : { errors: [{ message: 'Unauthorized' }] },
    })
  })
  await page.goto('/users/missing')
  await expect(page.getByRole('heading', { name: 'Profile not found' })).toBeVisible()
})

test('visitor can retry a failed profile request', async ({ page }) => {
  let attempts = 0
  await page.route('**/graphql', async (route) => {
    const { query } = route.request().postDataJSON() as { query: string }
    if (query.includes('PublicProfile')) {
      attempts++
      await route.fulfill({
        json:
          attempts === 1
            ? { errors: [{ message: 'Unavailable' }] }
            : { data: { publicProfile: author } },
      })
    } else if (query.includes('publishedContents')) {
      await route.fulfill({
        json: {
          data: { publishedContents: { items: [], endCursor: null, hasMore: false } },
        },
      })
    } else {
      await route.fulfill({ json: { errors: [{ message: 'Unauthorized' }] } })
    }
  })
  await page.goto('/users/author-1')
  await expect(page.getByRole('alert').getByText('Unable to load profile.')).toBeVisible()
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { name: 'Alex Writer' })).toBeVisible()
})

test('failed avatar falls back and published stories load in pages', async ({ page }) => {
  await page.route('https://images.example.test/broken.png', (route) => route.abort())
  await page.route('**/graphql', async (route) => {
    const { query, variables } = route.request().postDataJSON() as {
      query: string
      variables?: { after?: string }
    }
    if (query.includes('PublicProfile')) {
      await route.fulfill({
        json: {
          data: {
            publicProfile: {
              ...author,
              avatarUrl: 'https://images.example.test/broken.png',
            },
          },
        },
      })
    } else if (query.includes('publishedContents')) {
      await route.fulfill({
        json: {
          data: {
            publishedContents: variables?.after
              ? {
                  items: [{ ...story, id: 'story-2', title: 'Second Story' }],
                  endCursor: 'story-2',
                  hasMore: false,
                }
              : { items: [story], endCursor: story.id, hasMore: true },
          },
        },
      })
    } else {
      await route.fulfill({ json: { errors: [{ message: 'Unauthorized' }] } })
    }
  })
  await page.goto('/users/author-1')
  await expect(
    page.getByRole('img', { name: 'Default avatar for Alex Writer' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Load more' }).click()
  await expect(page.getByRole('link', { name: 'Read Second Story' })).toBeVisible()
})
