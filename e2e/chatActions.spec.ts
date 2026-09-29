import { expect, openApp, test } from './support/fixtures'

function chat(chatId: number, title: string, unread: number) {
  return {
    chatId,
    type: 'direct',
    title,
    unreadCount: unread,
    updatedAt: new Date().toISOString(),
    peerId: 100 + chatId,
    isAdmin: false,
    lastMessage: { messageId: 10, username: title, content: `Привет от ${title}` },
  }
}

test.beforeEach(async ({ api, page }) => {
  api.respond(/^\/chats\/?$/, [chat(1, 'Анна', 3), chat(2, 'Борис', 0)])
  await openApp(page)
  await page.locator('.bottom-nav__item', { hasText: 'Чаты' }).click()
  await expect(page.getByText('Анна', { exact: true })).toBeVisible()
  // Переход между страницами ещё идёт — ждём, пока список встанет на место
  await page.waitForTimeout(600)
})

async function swipeLeft(page: import('@playwright/test').Page, title: string) {
  const box = (await page.locator('.chat', { hasText: title }).boundingBox())!
  const y = box.y + box.height / 2
  await page.mouse.move(box.x + box.width - 20, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width - 200, y, { steps: 8 })
  await page.mouse.up()
}

test('свайп: «Прочитано» гасит счётчик и отправляет отметку', async ({ page, api }) => {
  await swipeLeft(page, 'Анна')
  await page.getByRole('button', { name: 'Прочитано' }).click()

  await expect(page.locator('.chat', { hasText: 'Анна' }).locator('.u-badge, [class*="badge"]').filter({ hasText: '3' })).toHaveCount(0)
  await expect.poll(() => api.requests.includes('POST /chats/1/read')).toBe(true)
  await expect(page).toHaveURL(/\/chats$/)
})

test('удержание: контекстное меню → удалить у обоих с галочкой', async ({ page, api }) => {
  const row = page.locator('.chat', { hasText: 'Борис' })
  await expect(row).toBeVisible()

  const box = (await row.boundingBox())!
  await page.mouse.move(box.x + 100, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(700)
  await page.mouse.up()

  await page.getByRole('menuitem', { name: 'Удалить' }).click()
  await page.getByText('Удалить у меня и у Борис').click()
  const request = page.waitForRequest(req => req.method() === 'DELETE' && req.url().includes('/chats/2'))
  await page.locator('.chat-actions').getByRole('button', { name: 'Удалить', exact: true }).click()
  expect(new URL((await request).url()).searchParams.get('forEveryone')).toBe('true')

  await expect(row).toHaveCount(0)
  await expect.poll(() => api.requests.includes('DELETE /chats/2')).toBe(true)
  await expect(page).toHaveURL(/\/chats$/)
})

test('свайп «Удалить» без галочки — только у себя', async ({ page }) => {
  await swipeLeft(page, 'Борис')
  await page.locator('.chat', { hasText: 'Борис' }).locator('xpath=..').locator('.chat-swipe__action--delete').click()
  const request = page.waitForRequest(req => req.method() === 'DELETE' && req.url().includes('/chats/2'))
  await page.locator('.chat-actions').getByRole('button', { name: 'Удалить', exact: true }).click()
  expect(new URL((await request).url()).searchParams.has('forEveryone')).toBe(false)
  await expect(page.locator('.chat', { hasText: 'Борис' })).toHaveCount(0)
})
