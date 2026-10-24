import { expect, test } from '@playwright/test'

test('reader follows an author and finds published stories in Following', async ({
  page,
}) => {
  const account = {
    id: 'reader-1',
    email: 'reader@example.test',
    username: 'Reader',
    roles: ['USER'],
    hasPassword: true,
  }
  const author = {
    id: 'author-1',
    username: 'Alex Writer',
    bio: 'Science writer',
    avatarUrl: null,
  }
  let followed = false
  await page.route('**/graphql', async (route) => {
    const { query, variables } = route.request().postDataJSON() as {
      query: string
      variables?: { after?: string }
    }
    if (query.includes('refreshTokens'))
      await route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'token', account } } },
      })
    else if (query.includes('PublicProfile'))
      await route.fulfill({ json: { data: { publicProfile: author } } })
    else if (query.includes('ProfileFollowedAuthors'))
      await route.fulfill({
        json: { data: { myFollowedAuthors: followed ? [author] : [] } },
      })
    else if (query.includes('FollowAuthor')) {
      followed = true
      await route.fulfill({ json: { data: { followAuthor: author } } })
    } else if (query.includes('UnfollowAuthor')) {
      followed = false
      await route.fulfill({ json: { data: { unfollowAuthor: true } } })
    } else if (query.includes('FollowingFeed'))
      await route.fulfill({
        json: {
          data: {
            myFollowedAuthors: followed ? [author] : [],
            followingFeed: {
              items:
                followed && variables?.after
                  ? [
                      {
                        id: 'story-2',
                        title: 'The Second Sky',
                        description: 'More stars',
                        status: 'PUBLISHED',
                        publishedAt: '2026-01-14T12:00:00.000Z',
                        viewCount: 2,
                        author,
                      },
                    ]
                  : followed
                    ? [
                        {
                          id: 'story-1',
                          title: 'Mapping the Night Sky',
                          description: 'A guide to stars',
                          status: 'PUBLISHED',
                          publishedAt: '2026-01-15T12:00:00.000Z',
                          viewCount: 12,
                          author,
                        },
                      ]
                    : [],
              endCursor: followed ? (variables?.after ? 'story-2' : 'story-1') : null,
              hasMore: followed && !variables?.after,
            },
          },
        },
      })
    else if (query.includes('publishedContents'))
      await route.fulfill({
        json: {
          data: { publishedContents: { items: [], endCursor: null, hasMore: false } },
        },
      })
    else await route.fulfill({ json: { data: {} } })
  })

  await page.goto('/users/author-1')
  await expect(page.getByRole('heading', { name: 'Alex Writer' })).toBeVisible()
  await page.getByRole('button', { name: 'Follow author' }).click()
  await expect(page.getByRole('button', { name: 'Following · Unfollow' })).toBeVisible()
  await page.getByRole('link', { name: 'Following', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Following' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mapping the Night Sky' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Alex Writer' })).toBeVisible()
  await page.getByRole('button', { name: 'Load more' }).click()
  await expect(page.getByRole('link', { name: 'The Second Sky' })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true)
  await page.getByRole('link', { name: 'Alex Writer' }).first().click()
  await page.getByRole('button', { name: 'Following · Unfollow' }).click()
  await expect(page.getByRole('button', { name: 'Follow author' })).toBeVisible()
  await page.getByRole('link', { name: 'Following', exact: true }).click()
  await expect(page.getByText('You are not following any authors yet.')).toBeVisible()
})
