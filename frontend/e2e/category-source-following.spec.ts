import { expect, test } from '@playwright/test'

test('reader follows category and source, sees a shared feed, then unfollows', async ({
  page,
}) => {
  const account = {
    id: 'reader-1',
    email: 'reader@example.test',
    username: 'Reader',
    roles: ['USER'],
    hasPassword: true,
  }
  const author = { id: 'author-1', username: 'Writer' }
  const category = { id: 'category-1', name: 'Science' }
  const source = { id: 'source-1', name: 'Journal', url: 'https://example.test' }
  let categoryFollowed = false
  let sourceFollowed = false
  await page.route('**/graphql', async (route) => {
    const { query } = route.request().postDataJSON() as { query: string }
    if (query.includes('refreshTokens'))
      await route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'token', account } } },
      })
    else if (query.includes('FollowCategory')) {
      categoryFollowed = true
      await route.fulfill({ json: { data: { followCategory: category } } })
    } else if (query.includes('UnfollowCategory')) {
      categoryFollowed = false
      await route.fulfill({ json: { data: { unfollowCategory: true } } })
    } else if (query.includes('FollowSource')) {
      sourceFollowed = true
      await route.fulfill({ json: { data: { followSource: source } } })
    } else if (query.includes('UnfollowSource')) {
      sourceFollowed = false
      await route.fulfill({ json: { data: { unfollowSource: true } } })
    } else if (query.includes('FollowingOptions'))
      await route.fulfill({
        json: { data: { categories: [category], sources: [source] } },
      })
    else if (query.includes('FollowedTopics'))
      await route.fulfill({
        json: {
          data: {
            myFollowedCategories: categoryFollowed ? [category] : [],
            myFollowedSources: sourceFollowed ? [source] : [],
          },
        },
      })
    else if (query.includes('FollowingFeed'))
      await route.fulfill({
        json: {
          data: {
            myFollowedAuthors: [],
            myFollowedCategories: categoryFollowed ? [category] : [],
            myFollowedSources: sourceFollowed ? [source] : [],
            followingFeed: {
              items:
                categoryFollowed || sourceFollowed
                  ? [
                      {
                        id: 'story-1',
                        title: 'Shared discovery',
                        description: 'Story',
                        status: 'PUBLISHED',
                        publishedAt: '2026-01-15T12:00:00.000Z',
                        viewCount: 2,
                        author,
                      },
                    ]
                  : [],
              endCursor: null,
              hasMore: false,
            },
          },
        },
      })
    else if (query.includes('PublicContent'))
      await route.fulfill({
        json: {
          data: {
            content: {
              id: 'story-1',
              title: 'Shared discovery',
              description: 'Story',
              type: 'ARTICLE',
              body: 'Story body',
              mediaUrl: null,
              thumbnail: null,
              status: 'PUBLISHED',
              publishedAt: '2026-01-15T12:00:00.000Z',
              likeCount: 0,
              viewCount: 2,
              liked: false,
              saved: false,
              author: { ...author, bio: null, avatarUrl: null },
              category,
              source,
              tags: [],
            },
          },
        },
      })
    else if (query.includes('CreateView'))
      await route.fulfill({ json: { data: { createView: { id: 'view-1' } } } })
    else if (query.includes('ContentComments'))
      await route.fulfill({ json: { data: { commentsByContent: [] } } })
    else await route.fulfill({ json: { data: {} } })
  })
  await page.goto('/following')
  await expect(page.getByRole('heading', { name: 'Following' })).toBeVisible()
  await page.getByRole('button', { name: 'Follow category Science' }).click()
  await page.getByRole('button', { name: 'Follow source Journal' }).click()
  await expect(page.getByRole('link', { name: 'Shared discovery' })).toHaveCount(1)
  await page.getByRole('button', { name: 'Unfollow category Science' }).click()
  await expect(page.getByRole('link', { name: 'Shared discovery' })).toHaveCount(1)
  await page.getByRole('button', { name: 'Unfollow source Journal' }).click()
  await expect(
    page.getByText('You are not following anyone or anything yet.'),
  ).toBeVisible()
  await page.goto('/content/story-1')
  await expect(page.getByRole('heading', { name: 'Shared discovery' })).toBeVisible()
  await page.getByRole('button', { name: 'Follow category Science' }).click()
  await page.getByRole('button', { name: 'Follow source Journal' }).click()
  await expect(
    page.getByRole('button', { name: 'Unfollow category Science' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Unfollow source Journal' }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true)
})
