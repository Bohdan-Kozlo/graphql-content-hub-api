import { expect, test } from '@playwright/test'

const cases = [
  {
    type: 'VIDEO',
    link: 'New video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    player: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  },
  {
    type: 'PODCAST',
    link: 'New podcast',
    url: 'https://open.spotify.com/episode/4uLU6hMCjMI75M1A2tKUQC',
    player: 'https://open.spotify.com/embed/episode/4uLU6hMCjMI75M1A2tKUQC',
  },
] as const

for (const scenario of cases) {
  test(`editor creates and reopens a ${scenario.type.toLowerCase()} draft`, async ({
    page,
  }) => {
    const account = {
      id: 'editor-1',
      email: 'editor@example.test',
      username: 'Mira',
      roles: ['EDITOR'],
      hasPassword: true,
    }
    let saved: Record<string, unknown> | null = null
    let input: Record<string, unknown> | null = null
    await page.route('**/graphql', async (route) => {
      const { query, variables } = route.request().postDataJSON() as {
        query: string
        variables?: { data?: Record<string, unknown> }
      }
      if (query.includes('refreshTokens'))
        return route.fulfill({
          json: { data: { refreshTokens: { accessToken: 'editor-token', account } } },
        })
      if (query.includes('EditorMetadataOptions'))
        return route.fulfill({
          json: {
            data: {
              categories: [{ id: 'science', name: 'Science' }],
              tags: [{ id: 'space', name: 'Space' }],
              sources: [],
            },
          },
        })
      if (query.includes('CreateEditorDraft')) {
        input = variables!.data!
        saved = {
          id: 'media-1',
          ...input,
          body: null,
          status: 'DRAFT',
          publishedAt: null,
          category: { id: 'science', name: 'Science' },
          tags: [{ id: 'space', name: 'Space' }],
          source: null,
        }
        return route.fulfill({ json: { data: { createContent: { id: 'media-1' } } } })
      }
      if (query.includes('MyDrafts'))
        return route.fulfill({ json: { data: { myDrafts: saved ? [saved] : [] } } })
      if (query.includes('MyContent('))
        return route.fulfill({ json: { data: { myContent: saved } } })
      if (query.includes('MyPublishedContents'))
        return route.fulfill({ json: { data: { myPublishedContents: [] } } })
      return route.fulfill({ json: { data: {} } })
    })
    await page.goto('/editor')
    await expect(page.getByRole('heading', { name: 'Your drafts' })).toBeVisible()
    await page.getByRole('link', { name: scenario.link }).click()
    await page.getByLabel('Title').fill('Night sky')
    await page.getByLabel('Description').fill('A guided tour')
    await page.getByLabel('Primary category').selectOption('science')
    await page.getByLabel('Space').check()
    await page.getByLabel('Media URL').fill('ftp://media.example.test/file')
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByRole('alert')).toContainText('valid HTTP(S) media URL')
    await page.getByLabel('Media URL').fill(scenario.url)
    await page
      .getByLabel('Thumbnail URL (optional)')
      .fill('https://images.example.test/cover.jpg')
    await page.getByLabel('Duration in seconds (optional)').fill('180')
    await page.getByRole('button', { name: 'Preview' }).click()
    await expect(
      page.getByTitle(
        `${scenario.type === 'VIDEO' ? 'Video' : 'Podcast'} player: Night sky`,
      ),
    ).toHaveAttribute('src', scenario.player)
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page).toHaveURL(/\/editor\/media-1$/)
    expect(input).toMatchObject({
      type: scenario.type,
      mediaUrl: scenario.url,
      thumbnail: 'https://images.example.test/cover.jpg',
      duration: 180,
      categoryId: 'science',
      tagIds: ['space'],
    })
    expect(input).not.toHaveProperty('body')
    await page.getByRole('link', { name: 'Your content' }).click()
    await expect(page.getByText('Night sky')).toBeVisible()
    await page.getByRole('link', { name: 'Open draft' }).click()
    await page.getByRole('button', { name: 'Preview' }).click()
    await expect(
      page.getByTitle(
        `${scenario.type === 'VIDEO' ? 'Video' : 'Podcast'} player: Night sky`,
      ),
    ).toHaveAttribute('src', scenario.player)
    await page.getByLabel('Media URL').fill('https://media.example.test/original')
    await expect(page.getByRole('link', { name: 'Open original media' })).toHaveAttribute(
      'href',
      'https://media.example.test/original',
    )
  })
}
