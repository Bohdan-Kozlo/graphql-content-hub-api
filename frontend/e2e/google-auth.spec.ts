import { expect, test } from '@playwright/test'

test('Google action is available on login and signup and starts at the HTTP endpoint', async ({
  page,
}) => {
  await page.route('**/graphql', (route) =>
    route.fulfill({ json: { errors: [{ message: 'Unauthorized' }] } }),
  )
  await page.goto('/login')
  const loginAction = page.getByRole('link', { name: 'Continue with Google' })
  await expect(loginAction).toBeVisible()
  await expect(loginAction).toHaveAttribute('href', '/auth/google?returnTo=%2Faccount')
  await page.goto('/signup')
  await expect(page.getByRole('link', { name: 'Continue with Google' })).toBeVisible()
  await page.goto('/?q=topic')
  await page.getByRole('link', { name: 'Sign in' }).click()
  await expect(page.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
    'href',
    '/auth/google?returnTo=%2F%3Fq%3Dtopic',
  )
  await page.goto('/saved?view=recent')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
    'href',
    '/auth/google?returnTo=%2Fsaved%3Fview%3Drecent',
  )
})

test('Google completion restores the local session and returns to a local page', async ({
  page,
}) => {
  const account = {
    id: 'google-reader',
    email: 'reader@example.com',
    username: 'Google Reader',
    roles: ['USER'],
    hasPassword: false,
  }
  await page.route('**/graphql', (route) => {
    const { query } = route.request().postDataJSON() as { query: string }
    if (query.includes('refreshTokens')) {
      return route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'memory-only-token', account } } },
      })
    }
    if (query.includes('PublicProfile')) {
      return route.fulfill({
        json: {
          data: {
            publicProfile: {
              id: account.id,
              username: account.username,
              avatarUrl: null,
              bio: null,
            },
          },
        },
      })
    }
    if (query.includes('setFirstPassword')) {
      return route.fulfill({ json: { data: { setFirstPassword: true } } })
    }
    return route.fulfill({ json: { errors: [{ message: 'Unauthorized' }] } })
  })
  await page.goto('/auth/google/complete?returnTo=%2Faccount')
  await expect(page.getByRole('heading', { name: 'Hello, Google Reader' })).toBeVisible()
  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByRole('heading', { name: 'Set a password' })).toBeVisible()
  await page.getByLabel('New password').fill('new-password-123')
  await page.getByLabel('Confirm password').fill('new-password-123')
  await page.getByRole('button', { name: 'Set password' }).click()
  await expect(page.getByRole('status')).toContainText(
    'Password set. You can now sign in with email.',
  )
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull()
})

test('cancelled Google sign-in shows an accessible message', async ({ page }) => {
  await page.route('**/graphql', (route) =>
    route.fulfill({ json: { errors: [{ message: 'Unauthorized' }] } }),
  )
  await page.goto('/login?google=cancelled')
  await expect(page.getByRole('alert')).toContainText('Google sign-in was cancelled')
})
