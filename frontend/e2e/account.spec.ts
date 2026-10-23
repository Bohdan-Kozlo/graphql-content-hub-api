import { expect, test } from '@playwright/test'

test('visitor signs up, restores the session, signs out, and signs in', async ({
  page,
}) => {
  const account = {
    id: 'reader-1',
    email: 'reader@example.com',
    username: 'reader',
    roles: ['USER'],
  }
  await page.route('**/graphql', async (route) => {
    const { query } = route.request().postDataJSON() as { query: string }
    if (query.includes('refreshTokens')) {
      const hasCookie = route
        .request()
        .headers()
        ['cookie']?.includes('content_hub_refresh=')
      await route.fulfill({
        headers: hasCookie
          ? {
              'set-cookie':
                'content_hub_refresh=rotated; HttpOnly; SameSite=Lax; Path=/graphql',
            }
          : {},
        json: hasCookie
          ? { data: { refreshTokens: { accessToken: 'access-token', account } } }
          : {
              errors: [
                { message: 'Unauthorized', extensions: { code: 'UNAUTHENTICATED' } },
              ],
            },
      })
    } else if (query.includes('signup') || query.includes('login(')) {
      await route.fulfill({
        headers: {
          'set-cookie':
            'content_hub_refresh=issued; HttpOnly; SameSite=Lax; Path=/graphql',
        },
        json: {
          data: query.includes('signup')
            ? { signup: { accessToken: 'access-token', account } }
            : { login: { accessToken: 'access-token', account } },
        },
      })
    } else if (query.includes('PublicProfile')) {
      await route.fulfill({
        json: {
          data: {
            publicProfile: {
              id: account.id,
              username: account.username,
              bio: null,
              avatarUrl: null,
            },
          },
        },
      })
    } else if (query.includes('logout')) {
      await route.fulfill({
        headers: {
          'set-cookie':
            'content_hub_refresh=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/graphql',
        },
        json: { data: { logout: true } },
      })
    } else {
      await route.fulfill({
        json: {
          data: {
            publishedContents: { items: [], endCursor: null, hasMore: false },
            categories: [],
            tags: [],
          },
        },
      })
    }
  })

  await page.goto('/signup')
  await page.getByLabel('Username').fill('reader')
  await page.getByLabel('Email').fill('reader@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Hello, reader' })).toBeVisible()
  expect(await page.evaluate(() => document.cookie)).not.toContain('content_hub_refresh')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Hello, reader' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email').fill('reader@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Hello, reader' })).toBeVisible()
})

test('sign out renews an expired access token before revoking the session', async ({
  page,
}) => {
  const account = {
    id: 'reader-1',
    email: 'reader@example.com',
    username: 'reader',
    roles: ['USER'],
  }
  let logoutCalls = 0
  let refreshCalls = 0
  await page.route('**/graphql', async (route) => {
    const { query } = route.request().postDataJSON() as { query: string }
    if (query.includes('refreshTokens')) {
      refreshCalls++
      await route.fulfill({
        json:
          refreshCalls === 1
            ? { errors: [{ message: 'Unauthorized' }] }
            : { data: { refreshTokens: { accessToken: 'renewed', account } } },
      })
    } else if (query.includes('login(')) {
      await route.fulfill({
        json: { data: { login: { accessToken: 'expired', account } } },
      })
    } else if (query.includes('PublicProfile')) {
      await route.fulfill({
        json: {
          data: {
            publicProfile: {
              id: account.id,
              username: account.username,
              bio: null,
              avatarUrl: null,
            },
          },
        },
      })
    } else if (query.includes('logout')) {
      logoutCalls++
      await route.fulfill({
        json:
          logoutCalls === 1
            ? { errors: [{ message: 'Unauthorized' }] }
            : { data: { logout: true } },
      })
    } else {
      await route.fulfill({
        json: {
          data: {
            publishedContents: { items: [], endCursor: null, hasMore: false },
            categories: [],
            tags: [],
          },
        },
      })
    }
  })
  await page.goto('/login')
  await page.getByLabel('Email').fill('reader@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Hello, reader' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  expect(logoutCalls).toBe(2)
  expect(refreshCalls).toBe(2)
})
