import { expect, test } from '@playwright/test'

test('follows the system theme until a manual choice is made', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')

  const root = page.locator('html')
  await expect(root).toHaveAttribute('data-theme', 'dark')
  await expect(root).toHaveCSS('background-color', 'rgb(30, 26, 37)')

  await page.emulateMedia({ colorScheme: 'light' })
  await expect(root).toHaveAttribute('data-theme', 'light')
  await expect(root).toHaveCSS('background-color', 'rgb(248, 246, 249)')

  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(root).toHaveAttribute('data-theme', 'dark')
  await expect(root).toHaveCSS('background-color', 'rgb(30, 26, 37)')
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('content-hub-theme')))
    .toBe('dark')

  await page.emulateMedia({ colorScheme: 'light' })
  await expect(root).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(root).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
})
