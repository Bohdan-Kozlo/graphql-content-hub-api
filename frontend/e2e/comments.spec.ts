import { expect, test } from '@playwright/test'

const story = {
  id: 'story-comments',
  title: 'A story for discussion',
  description: 'Join in',
  body: 'Story body',
  mediaUrl: null,
  thumbnail: null,
  type: 'ARTICLE',
  status: 'PUBLISHED',
  publishedAt: '2026-10-24T12:00:00.000Z',
  likeCount: 0,
  viewCount: 0,
  liked: false,
  saved: false,
  author: { id: 'writer', username: 'Writer', bio: null, avatarUrl: null },
  category: null,
  tags: [],
  source: null,
}
const reader = {
  id: 'reader',
  email: 'reader@example.test',
  username: 'Reader',
  roles: ['USER'],
}
const other = { id: 'other', username: 'Other', avatarUrl: null }

function comment(id: string, text: string, user = reader, replies: unknown[] = []) {
  return {
    id,
    text,
    isDeleted: false,
    createdAt: '2026-10-24T12:00:00.000Z',
    user: { id: user.id, username: user.username, avatarUrl: null },
    replies,
  }
}

test('reader posts, replies once, and edits their comment', async ({ page }) => {
  const roots = [comment('existing', 'A first thought', other)]
  await page.route('**/graphql', async (route) => {
    const { query, variables } = route.request().postDataJSON() as {
      query: string
      variables?: { data?: { text: string; parentId?: string }; id?: string }
    }
    if (query.includes('refreshTokens'))
      return route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'token', account: reader } } },
      })
    if (query.includes('CreateView'))
      return route.fulfill({ json: { data: { createView: { id: 'view' } } } })
    if (query.includes('ContentComments'))
      return route.fulfill({ json: { data: { commentsByContent: roots } } })
    if (query.includes('CreateContentComment')) {
      const next = comment(`new-${roots.length}`, variables?.data?.text ?? '')
      if (variables?.data?.parentId)
        roots.find((root) => root.id === variables.data?.parentId)?.replies.push(next)
      else roots.push(next)
      return route.fulfill({ json: { data: { createComment: { id: next.id } } } })
    }
    if (query.includes('UpdateContentComment')) {
      const target = roots.find((root) => root.id === variables?.id)
      if (target) target.text = variables?.data?.text ?? ''
      return route.fulfill({ json: { data: { updateComment: { id: variables?.id } } } })
    }
    return route.fulfill({ json: { data: { content: story } } })
  })
  await page.goto('/content/story-comments')
  await expect(
    page.getByRole('heading', { name: 'Discussion', exact: true }),
  ).toBeVisible()
  await page.getByLabel('Write a comment').fill('My first comment')
  await page.getByRole('button', { name: 'Post comment' }).click()
  await expect(page.getByText('My first comment')).toBeVisible()
  await page.getByRole('button', { name: 'Reply' }).first().click()
  await expect(page.getByRole('textbox', { name: 'Reply to Other' })).toBeFocused()
  await page.getByLabel('Reply to Other').fill('A reply')
  await page.getByRole('button', { name: 'Post reply' }).click()
  await expect(page.getByText('A reply')).toBeVisible()
  await expect(page.getByText('reader@example.test')).toHaveCount(0)
  await page
    .getByRole('article')
    .filter({ hasText: 'My first comment' })
    .getByRole('button', { name: 'Edit' })
    .click()
  await expect(page.getByRole('textbox', { name: 'Edit comment' })).toBeFocused()
  await page.getByLabel('Edit comment').fill('My edited comment')
  await page.getByRole('button', { name: 'Save edit' }).click()
  await expect(page.getByText('My edited comment')).toBeVisible()
  await expect(
    page
      .getByRole('article')
      .filter({ hasText: 'A reply' })
      .getByRole('button', { name: 'Reply' }),
  ).toHaveCount(0)
  await expect(
    page
      .getByRole('article')
      .filter({ hasText: 'A first thought' })
      .getByRole('button', { name: 'Edit' }),
  ).toHaveCount(0)
})

test('admin removes another reader’s comment while its reply stays visible', async ({
  page,
}) => {
  const admin = { ...reader, id: 'admin', username: 'Admin', roles: ['ADMIN'] }
  const roots = [
    comment('parent', 'Moderate this', other, [comment('reply', 'Keep this reply')]),
  ]
  await page.route('**/graphql', async (route) => {
    const { query } = route.request().postDataJSON() as { query: string }
    if (query.includes('refreshTokens'))
      return route.fulfill({
        json: { data: { refreshTokens: { accessToken: 'token', account: admin } } },
      })
    if (query.includes('CreateView'))
      return route.fulfill({ json: { data: { createView: { id: 'view' } } } })
    if (query.includes('ContentComments'))
      return route.fulfill({ json: { data: { commentsByContent: roots } } })
    if (query.includes('DeleteContentComment')) {
      roots[0].isDeleted = true
      roots[0].text = '[deleted]'
      return route.fulfill({ json: { data: { deleteComment: true } } })
    }
    return route.fulfill({ json: { data: { content: story } } })
  })
  await page.goto('/content/story-comments')
  await page
    .getByRole('article')
    .filter({ hasText: 'Moderate this' })
    .getByRole('button', { name: 'Remove' })
    .click()
  await expect(page.getByText('Comment removed')).toBeVisible()
  await expect(page.getByText('Keep this reply')).toBeVisible()
  await expect(page.getByText('Moderate this')).toHaveCount(0)
})

test('guest can read comments but sees no discussion actions', async ({ page }) => {
  await page.route('**/graphql', (route) => {
    const { query } = route.request().postDataJSON() as { query: string }
    if (query.includes('refreshTokens'))
      return route.fulfill({ json: { errors: [{ message: 'Unauthorized' }] } })
    if (query.includes('CreateView'))
      return route.fulfill({ json: { data: { createView: { id: 'view' } } } })
    if (query.includes('ContentComments'))
      return route.fulfill({
        json: {
          data: { commentsByContent: [comment('one', 'A public comment', other)] },
        },
      })
    return route.fulfill({ json: { data: { content: story } } })
  })
  await page.goto('/content/story-comments')
  await expect(page.getByText('A public comment')).toBeVisible()
  const discussion = page.getByRole('region', { name: 'Discussion' })
  await expect(discussion.getByRole('link', { name: 'Sign in' })).toBeVisible()
  await expect(
    discussion.getByRole('button', { name: /^(Reply|Edit|Remove)$/ }),
  ).toHaveCount(0)
})
