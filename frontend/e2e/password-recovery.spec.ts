import { expect, test } from '@playwright/test'

test('visitor requests a password reset from sign in', async ({ page }) => {
  await page.route('**/graphql', (route) => {
    const body = route.request().postDataJSON() as { operationName?: string }
    if (body.operationName === 'RequestPasswordReset') {
      return route.fulfill({ json: { data: { requestPasswordReset: true } } })
    }
    return route.fulfill({ json: { errors: [{ message: 'Unauthorized' }] } })
  })

  await page.goto('/login')
  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await expect(page).toHaveURL(/\/forgot-password$/)
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible()
  await page.getByLabel('Email').fill('reader@example.com')
  await expect(page.getByLabel('Email')).toHaveValue('reader@example.com')
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/graphql') &&
        (response.request().postDataJSON() as { operationName?: string })
          .operationName === 'RequestPasswordReset',
    ),
    page.getByRole('button', { name: 'Send reset link' }).click(),
  ])
  await expect(page.getByText(/If an account exists for this email/)).toBeVisible({
    timeout: 10_000,
  })
})

test('visitor sets a new password from the emailed link', async ({ page }) => {
  await page.route('**/graphql', (route) => {
    const body = route.request().postDataJSON() as { operationName?: string }
    if (body.operationName === 'ResetPassword') {
      return route.fulfill({ json: { data: { resetPassword: true } } })
    }
    return route.fulfill({ json: { errors: [{ message: 'Unauthorized' }] } })
  })

  await page.goto('/reset-password?token=valid-token')
  await page.getByLabel('New password', { exact: true }).fill('new-password-123')
  await page.getByLabel('Confirm new password', { exact: true }).fill('new-password-123')
  await page.getByRole('button', { name: 'Reset password' }).click()
  await expect(page.getByText('Your password has been changed.')).toBeVisible()
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Sign in' }),
  ).toHaveAttribute('href', '/login')
})

test('used or expired reset link offers a new request', async ({ page }) => {
  await page.route('**/graphql', (route) => {
    const body = route.request().postDataJSON() as { operationName?: string }
    if (body.operationName === 'ResetPassword') {
      return route.fulfill({
        json: {
          errors: [
            {
              message: 'Invalid or expired reset link',
              extensions: { code: 'INVALID_RESET_TOKEN' },
            },
          ],
        },
      })
    }
    return route.fulfill({ json: { errors: [{ message: 'Unauthorized' }] } })
  })

  await page.goto('/reset-password?token=used-token')
  await page.getByLabel('New password', { exact: true }).fill('new-password-123')
  await page.getByLabel('Confirm new password', { exact: true }).fill('new-password-123')
  await page.getByRole('button', { name: 'Reset password' }).click()
  await expect(page.getByText('This reset link is invalid or expired.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
    'href',
    '/forgot-password',
  )
})
